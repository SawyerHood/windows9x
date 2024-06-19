"use client";
import { useFormState } from "react-dom";

export type SignUpState =
  | { type: "error"; error: string }
  | { type: "success" }
  | { type: "initial" };

const initialState: SignUpState = { type: "initial" };

export function Form({
  action,
}: {
  action: (prevState: SignUpState, formData: FormData) => Promise<SignUpState>;
}) {
  const [state, formAction] = useFormState(action, initialState);
  return (
    <form action={formAction}>
      <div className="field-row">
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" />
      </div>
      <button type="submit">Sign Up</button>
      {state.type === "error" && <p style={{ color: "red" }}>{state.error}</p>}
      {state.type === "success" && (
        <p style={{ color: "green" }}>
          We&apos;ll let you know when we launch!
        </p>
      )}
    </form>
  );
}
