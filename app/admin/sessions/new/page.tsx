import { NewSessionForm } from "./form";

export default function NewSessionPage() {
  const defaultGuestFee = Number(process.env.BCLB_DEFAULT_GUEST_FEE) || 0;
  return <NewSessionForm defaultGuestFee={defaultGuestFee} />;
}
