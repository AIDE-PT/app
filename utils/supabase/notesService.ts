import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSupabaseClient } from "./client";

const LOCAL_NOTES_STORAGE_KEY = "@aide_notes";

export type Note = {
  id: string;
  patient_id: string;
  creator_id: string;
  title: string;
  description: string;
  reference_date?: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteWithCreator = Note & {
  creator?: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type CreateNoteInput = {
  patient_id: string;
  creator_id: string;
  title: string;
  description?: string;
  reference_date?: string;
};

export type UpdateNoteInput = {
  title?: string;
  description?: string;
  reference_date?: string;
};

const readLocalNotes = async (): Promise<Note[]> => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_NOTES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalNotes = async (notes: Note[]) => {
  await AsyncStorage.setItem(LOCAL_NOTES_STORAGE_KEY, JSON.stringify(notes));
};

const toLocalNote = (input: CreateNoteInput): Note => {
  const now = new Date().toISOString();

  return {
    id: `local-${now}-${Math.random().toString(36).slice(2, 10)}`,
    patient_id: input.patient_id,
    creator_id: input.creator_id,
    title: input.title || "Sem título",
    description: input.description ?? "",
    reference_date: input.reference_date ?? null,
    created_at: now,
    updated_at: now,
  };
};

export async function getNotesByPatient(patient_id: string): Promise<Note[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("notes")
      .select("*")
      .eq("patient_id", patient_id)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  } catch {
    const localNotes = await readLocalNotes();
    return localNotes
      .filter((note) => note.patient_id === patient_id)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
  }
}

export async function getNotesByCreator(creator_id: string): Promise<Note[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("notes")
      .select("*")
      .eq("creator_id", creator_id)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  } catch {
    const localNotes = await readLocalNotes();
    return localNotes
      .filter((note) => note.creator_id === creator_id)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
  }
}

export async function getNoteById(id: string): Promise<Note | null> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("notes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return data;
  } catch {
    const localNotes = await readLocalNotes();
    return localNotes.find((note) => note.id === id) ?? null;
  }
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("notes")
      .insert({
        patient_id: input.patient_id,
        creator_id: input.creator_id,
        title: input.title || "Sem título",
        description: input.description ?? "",
        reference_date: input.reference_date ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch {
    const note = toLocalNote(input);
    const localNotes = await readLocalNotes();
    const nextNotes = [note, ...localNotes];
    await writeLocalNotes(nextNotes);
    return note;
  }
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<Note> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("notes")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch {
    const localNotes = await readLocalNotes();
    const noteIndex = localNotes.findIndex((note) => note.id === id);

    if (noteIndex === -1) {
      throw new Error("Nota não encontrada no armazenamento local.");
    }

    const updatedNote: Note = {
      ...localNotes[noteIndex],
      ...input,
      title: input.title ?? localNotes[noteIndex].title,
      description: input.description ?? localNotes[noteIndex].description,
      reference_date:
        input.reference_date ?? localNotes[noteIndex].reference_date,
      updated_at: new Date().toISOString(),
    };

    const nextNotes = [...localNotes];
    nextNotes[noteIndex] = updatedNote;
    await writeLocalNotes(nextNotes);
    return updatedNote;
  }
}

export async function deleteNote(id: string): Promise<void> {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from("notes").delete().eq("id", id);

    if (error) throw new Error(error.message);
  } catch {
    const localNotes = await readLocalNotes();
    const nextNotes = localNotes.filter((note) => note.id !== id);
    await writeLocalNotes(nextNotes);
  }
}

export async function getNotesWithCreator(
  patient_id: string,
): Promise<NoteWithCreator[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("notes")
      .select(
        `
      *,
      creator:users!notes_creator_id_fkey (
        id,
        name,
        email
      )
    `,
      )
      .eq("patient_id", patient_id)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as NoteWithCreator[];
  } catch {
    const localNotes = await readLocalNotes();
    return localNotes
      .filter((note) => note.patient_id === patient_id)
      .map((note) => ({
        ...note,
        creator: undefined,
      }))
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
  }
}
