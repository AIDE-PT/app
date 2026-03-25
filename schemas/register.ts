import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().refine((value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?\d{9,15}$/;
      const cleanPhone = value.replace(/\s/g, "");

      return emailRegex.test(value) || phoneRegex.test(cleanPhone);
    }, "Introduza um email ou telemovel valido"),
    password: z
      .string()
      .min(6, "Password deve ter pelo menos 6 caracteres")
      .regex(/\d/, "Password deve conter pelo menos um numero")
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        "Password deve conter pelo menos um caractere especial",
      ),
    repeatPassword: z.string(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "As passwords nao coincidem",
    path: ["repeatPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const registerFieldCopy: Record<
  keyof RegisterFormData,
  {
    label: string;
    placeholder: string;
    helperText: string;
  }
> = {
  name: {
    label: "Nome",
    placeholder: "Introduza o seu nome",
    helperText: "Escreva o nome que quer mostrar na sua conta.",
  },
  email: {
    label: "Email ou telemovel",
    placeholder: "nome@email.com ou +351912345678",
    helperText:
      "Use um email valido ou um telemovel com indicativo (ex.: +351912345678).",
  },
  password: {
    label: "Password",
    placeholder: "Crie uma password segura",
    helperText: "Use 6+ caracteres, incluindo pelo menos 1 numero e 1 simbolo.",
  },
  repeatPassword: {
    label: "Confirmar password",
    placeholder: "Repita a password",
    helperText: "Repita exatamente a mesma password.",
  },
};
