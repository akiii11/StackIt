"use client";

import {
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState, useContext } from "react";
import { UserContext } from "@/contexts/user-context"; // ✅ adjust path
import { authClient } from "./lib/auth/client";
import router from "next/router";
import React from "react";
import { logger } from "./lib/default-logger";

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

  const { user, isLoading } = useContext(UserContext) ?? {
    user: null,
    isLoading: true,
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        logger.error("Sign out error", error);
        return;
      }

      // UserProvider, for this case, will not refresh the router and we need to do it manually
      // After refresh, AuthGuard will handle the redirect
    } catch (err) {
      logger.error("Sign out error", err);
    }
  }, [router]);
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

        {/* Right corner */}
        <Box>
          {isLoading ? null : user ? (
            <>
              <IconButton onClick={handleAvatarClick}>
                <Avatar sx={{ bgcolor: "#1976d2" }}>
                  {user.username?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
              >
                <MenuItem disabled>{user.username}</MenuItem>
                <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Link href="/auth/login" passHref>
                <Button variant="text" sx={{ mr: 1 }}>
                  Login
                </Button>
              </Link>
              <Link href="/auth/register" passHref>
                <Button variant="outlined">Register</Button>
              </Link>
            </>
          )}
        </Box>
      </Box>

      {/* Main Content */}
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
