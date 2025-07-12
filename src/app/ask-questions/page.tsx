"use client";

import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import {
  QuestionPostRequestData,
  QuestionPutRequestData,
} from "../types/api-requests";
import { postData, putData } from "../lib/connection";
import { ApiResponse } from "../types/api-response";
import { ApiNames, ServerCodes } from "../constants/constants";
import { Questions } from "../types/questions";

// ✅ Tags
const tagOptions = ["React", "JWT", "Next.js", "SQL", "Authentication"];

// ✅ Zod Schema
const questionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description is too short"),
  tagIds: z.array(z.string()).nonempty("Select at least one tag"),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function AskQuestionPage() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      description: "",
      tagIds: [],
    },
  });

  const tags = watch("tagIds");

  // ✅ Tiptap Editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onUpdate({ editor }) {
      setValue("description", editor.getHTML());
    },
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
    if (editor) {
      editor.commands.setContent("");
    }
  };

  const handleTagSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!tags.includes(value)) {
      setValue("tagIds", [...tags, value]);
    }
  };

  const handleTagDelete = (tagToDelete: string) => {
    setValue(
      "tagIds",
      tags.filter((tag) => tag !== tagToDelete)
    );
  };

  const updateQuestion = async (requestData: QuestionPutRequestData) => {
    const response: ApiResponse = await putData(
      ApiNames.Questions,
      requestData
    );
    if (response.code !== ServerCodes.Success) {
      return { error: response.message, data: [] };
    }
    let visitor: Questions[] = [];
    if (response.data) {
      visitor = response.data.map((item): Questions => ({ ...item }));
    }
    return { data: visitor };
  };

  const createQuestion = async (requestData: QuestionPostRequestData) => {
    const response: ApiResponse = await postData(
      ApiNames.Questions,
      requestData
    );
    if (response.code !== ServerCodes.Success) {
      return { error: response.message, data: [] };
    }
    let visitor: Questions[] = [];
    if (response.data) {
      visitor = response.data.map((item): Questions => ({ ...item }));
    }
    return { data: visitor };
  };

  const onSubmit = React.useCallback(
    async (values: QuestionFormData): Promise<void> => {
      setIsPending(true);
      let result;
      console.log("Submitting form with values:", values);
      if (values.id) {
        const requestData: QuestionPutRequestData = {
          id: values.id,
          title: values.title,
          description: values.description,
          tag: values.tagIds, // Use tagIds for consistency
        };
        result = await updateQuestion(requestData);
      } else {
        const requestData: QuestionPostRequestData = {
          title: values.title,
          description: values.description,
          tagIds: values.tagIds,
        };
        result = await createQuestion(requestData);
      }

      if (result.error) {
        setIsPending(false);
        return;
      }

      setIsPending(false);
      handleClose();
      reset();
    },
    [handleClose, reset]
  );

  return (
    <Container>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        my={4}
      >
        <Typography variant="h4" component="h1">
          Community Questions
        </Typography>
        <Button variant="contained" onClick={handleOpen}>
          Ask a Question
        </Button>
      </Box>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>Ask a Question 🧠</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={3} mt={1}>
              {/* Title Field */}
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Title"
                    fullWidth
                    placeholder="e.g. How to use JWT in Next.js?"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />

              {/* Description using Tiptap */}
              <Box>
                <Typography variant="subtitle1">Description</Typography>
                <Box
                  sx={{
                    border: "1px solid #ccc",
                    borderRadius: 1,
                    minHeight: 150,
                    p: 2,
                    backgroundColor: "#fafafa",
                  }}
                >
                  {editor && <EditorContent editor={editor} />}
                </Box>
                {errors.description && (
                  <Typography variant="body2" color="error" mt={1}>
                    {errors.description.message}
                  </Typography>
                )}
              </Box>

              {/* Tags */}
              <TextField
                select
                label="Select Tags"
                onChange={handleTagSelect}
                value=""
                error={!!errors.tagIds}
                helperText={errors.tagIds?.message}
              >
                {tagOptions.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </TextField>

              {/* Selected Tags */}
              <Box display="flex" gap={1} flexWrap="wrap">
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleTagDelete(tag)}
                  />
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Submit Question
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
