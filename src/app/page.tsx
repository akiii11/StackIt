"use client";

import {
  Box,
  Container,
  TextField,
  MenuItem,
  Button,
  Typography,
} from "@mui/material";
import { useState } from "react";
import Link from "next/link";
const mockQuestions = [
  {
    id: 1,
    title: "How to join 2 columns in SQL?",
    description:
      "I want to join column A and B to create a new one but I don’t know SQL well...",
    tags: ["SQL", "Beginner"],
    votes: 4,
    author: "User123",
  },
  {
    id: 2,
    title: "How to implement JWT in Next.js?",
    description:
      "I'm trying to add JWT-based auth in my app but struggling with token refresh...",
    tags: ["Next.js", "JWT", "Auth"],
    votes: 7,
    author: "DevDoe",
  },
];

export default function Home() {
  const [filter, setFilter] = useState("newest");

  return (
    <>
      {/* Header */}
      <Box
        component="header"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={4}
        py={2}
        bgcolor="#f9f9f9"
        borderBottom="1px solid #ddd"
      >
        <Typography variant="h6">StackIt</Typography>
        <Box>
          <Link href="/auth/login" passHref>
            <Button variant="outlined">Login</Button>
          </Link>
          <Link href="/auth/register" passHref>
            <Button variant="outlined">Register</Button>
          </Link>
        </Box>
      </Box>

      {/* Main content */}
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {/* Filters + Search */}
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={3}>
          <TextField placeholder="Search..." fullWidth />
          <TextField
            select
            label="Filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            size="small"
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="unanswered">Unanswered</MenuItem>
            <MenuItem value="popular">Popular</MenuItem>
          </TextField>
          <Button variant="contained">Ask New Question</Button>
        </Box>

        {/* Question List */}
        {mockQuestions.map((q) => (
          <Box
            key={q.id}
            border="1px solid #ddd"
            borderRadius="10px"
            p={2}
            mb={2}
            bgcolor="#fff"
          >
            <Typography variant="h6">{q.title}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }} color="text.secondary">
              {q.description}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
              {q.tags.map((tag) => (
                <Box
                  key={tag}
                  px={1.5}
                  py={0.5}
                  bgcolor="#e0e0e0"
                  borderRadius="5px"
                  fontSize="12px"
                >
                  {tag}
                </Box>
              ))}
            </Box>
            <Typography variant="caption">
              {q.votes} votes • asked by {q.author}
            </Typography>
          </Box>
        ))}
      </Container>
    </>
  );
}
