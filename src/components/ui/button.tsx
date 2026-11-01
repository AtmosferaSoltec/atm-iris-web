import type { ComponentProps } from "react";
import { buttonStyles, type ButtonStyle } from "./button-styles";

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & ButtonStyle) {
  return <button className={buttonStyles({ variant, size, className })} {...props} />;
}
