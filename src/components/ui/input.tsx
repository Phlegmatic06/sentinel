"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
  className?: string;
}

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const letterVariants = {
  initial: {
    y: 0,
    color: "inherit",
  },
  animate: {
    y: "-120%",
    color: "#a855f7", // Vibrant purple (purple-500)
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

export const Input = ({
  label,
  className = "",
  value,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const showLabel = isFocused || value.length > 0;

  return (
    <div className={cn("relative", className)}>
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400"
        variants={containerVariants}
        initial="initial"
        animate={showLabel ? "animate" : "initial"}
      >
        {label.split("").map((char, index) => (
          <motion.span
            key={index}
            className="inline-block text-sm"
            variants={letterVariants}
            style={{ willChange: "transform" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.div>

      <input
        id={props.id}
        type={props.type || "text"}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        spellCheck={false}
        {...props}
        className="outline-none border-b-2 border-slate-200 dark:border-white/20 focus:border-purple-500 py-2 w-full text-base font-medium text-slate-50 bg-transparent placeholder-transparent transition-all"
        style={{ color: '#f8fafc' }}
      />
    </div>
  );
};
