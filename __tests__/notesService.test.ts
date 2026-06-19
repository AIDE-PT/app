import { describe, expect, jest, test, beforeEach } from "@jest/globals";

// Mock getSupabaseClient before importing notesService
const mockFrom = jest.fn();
const mockSupabase = { from: mockFrom };

jest.mock("@/utils/supabase/client", () => ({
  getSupabaseClient: () => mockSupabase,
  hasSupabaseConfig: true,
}));

import {
  createNote,
  getNotesByPatient,
  updateNote,
  deleteNote,
} from "@/utils/supabase/notesService";

const PATIENT_ID = "patient-uuid-1";
const CREATOR_ID = "creator-uuid-1";
const NOTE_ID = "note-uuid-1";

const mockNote = {
  id: NOTE_ID,
  patient_id: PATIENT_ID,
  creator_id: CREATOR_ID,
  title: "Nota de teste",
  content: "Conteúdo",
  reference_date: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

function makeChain(finalResult: object) {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "order",
    "single",
    "limit",
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  // The terminal call resolves with the result
  (chain.single as jest.Mock).mockResolvedValue(finalResult as never);
  (chain.order as jest.Mock).mockResolvedValue(finalResult as never);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getNotesByPatient", () => {
  test("returns notes array on success", async () => {
    const chain = makeChain({ data: [mockNote], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getNotesByPatient(PATIENT_ID);
    expect(mockFrom).toHaveBeenCalledWith("notes");
    expect(result).toEqual([mockNote]);
  });

  test("throws on Supabase error", async () => {
    const chain = makeChain({ data: null, error: { message: "DB error" } });
    (chain.order as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    } as never);
    mockFrom.mockReturnValue(chain);

    await expect(getNotesByPatient(PATIENT_ID)).rejects.toThrow("DB error");
  });
});

describe("createNote", () => {
  test("returns created note on success", async () => {
    const chain = makeChain({ data: mockNote, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await createNote({
      patient_id: PATIENT_ID,
      creator_id: CREATOR_ID,
      title: "Nota de teste",
      content: "Conteúdo",
    });

    expect(mockFrom).toHaveBeenCalledWith("notes");
    expect(result).toEqual(mockNote);
  });

  test("uses 'Sem título' when title is empty", async () => {
    const chain = makeChain({ data: { ...mockNote, title: "Sem título" }, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await createNote({
      patient_id: PATIENT_ID,
      creator_id: CREATOR_ID,
      title: "",
    });

    expect(result.title).toBe("Sem título");
  });
});

describe("updateNote", () => {
  test("returns updated note", async () => {
    const updated = { ...mockNote, title: "Novo título" };
    const chain = makeChain({ data: updated, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await updateNote(NOTE_ID, { title: "Novo título" });
    expect(result.title).toBe("Novo título");
  });
});

describe("deleteNote", () => {
  test("resolves without error on success", async () => {
    const chain = makeChain({ error: null });
    (chain.eq as jest.Mock).mockResolvedValue({ error: null } as never);
    mockFrom.mockReturnValue(chain);

    await expect(deleteNote(NOTE_ID)).resolves.toBeUndefined();
  });
});
