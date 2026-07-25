"use client";

import React from "react";
import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorViewOptionsCtx,
} from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { history } from "@milkdown/plugin-history";

interface MilkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

const MilkdownInner = ({ value, onChange, placeholder }: MilkdownEditorProps) => {
  useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, value);
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          attributes: {
            class: "milkdown-content",
            spellcheck: "false",
          },
        }));
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          onChange(markdown);
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(listener)
      .use(history)
  );

  return <Milkdown />;
};

const MilkdownEditor = (props: MilkdownEditorProps) => {
  return (
    <MilkdownProvider>
      <div className="milkdown-wrapper" onBlur={props.onBlur}>
        <MilkdownInner {...props} />
      </div>
    </MilkdownProvider>
  );
};

export default MilkdownEditor;
