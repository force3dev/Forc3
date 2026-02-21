import { ButtonHTMLAttributes } from "react";
export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <button {...rest} className={"px-3 py-2 rounded-xl bg-white text-black font-medium " + className} />;
}
