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
import { useState, useContext, useEffect, useCallback, useRef } from "react";
import { UserContext } from "@/contexts/user-context";
import { authClient } from "./lib/auth/client";
import router from "next/navigation";
import React from "react";
import { logger } from "./lib/default-logger";
import { getData, postData } from "./lib/connection";
import { ApiNames, ServerCodes } from "./constants/constants";
import { Questions } from "./types/questions";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function Home() {
  const [questions, setQuestions] = useState<Questions[]>([]);
  const [filter, setFilter] = useState("newest");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  );
  const [answerContent, setAnswerContent] = useState("");

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

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        logger.error("Sign out error", error);
        return;
      }

      // Clear user state and reload the page
      setAnchorEl(null);
      window.location.reload();
    } catch (err) {
      logger.error("Sign out error", err);
    }
  }, []);

  type Notification = {
    id: string;
    message: string;
    // Add other fields as needed
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const notificationOpen = Boolean(notificationAnchorEl);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getData(ApiNames.Notifications, {});
        if (response.code === ServerCodes.Success && response.data) {
          setNotifications(response.data);
        } else {
          logger.error("Failed to fetch notifications", response.message);
        }
      } catch (error) {
        logger.error("Error fetching notifications", error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await getData(ApiNames.Questions, {});
        if (response.code === ServerCodes.Success && response.data) {
          const enrichedQuestions = response.data.map((question) => ({
            ...question,
            answers: question.answers || [],
          }));
          setQuestions(enrichedQuestions);
        } else {
          logger.error("Failed to fetch questions", response.message);
        }
      } catch (error) {
        logger.error("Error fetching questions", error);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswerClick = (questionId: string) => {
    if (typeof window === "undefined") {
      logger.error("Router is not available on the server side");
      return;
    }

    if (!user) {
      router.redirect("/auth/login");
    } else {
      setCurrentQuestionId(questionId);
      setOpenDialog(true);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setCurrentQuestionId(null);
    setAnswerContent("");
  };

  const handleSubmitAnswer = async () => {
    if (!answerContent || !currentQuestionId) {
      logger.error("Missing required fields for submitting an answer");
      return;
    }

    try {
      const response = await postData(ApiNames.Answers, {
        content: answerContent,
        questionId: currentQuestionId,
      });

      if (response.code === ServerCodes.Success) {
        handleDialogClose();
      } else {
        logger.error("Failed to submit answer", response.message);
      }
    } catch (error) {
      logger.error("Error submitting answer", error);
    }
  };

  const handleVote = async (answerId: string, voteType: 1 | -1) => {
    if (!user) {
      router.redirect("/auth/login");
    }

    try {
      const response = await postData(ApiNames.Votes, {
        answerId,
        vote: voteType,
      });

      if (response.code === ServerCodes.Success) {
        setQuestions((prevQuestions) =>
          prevQuestions.map((q) => {
            if (q.id === currentQuestionId) {
              return {
                ...q,
                answers: q.answers.map((a) =>
                  a.id === answerId
                    ? { ...a, voteCount: a.voteCount + voteType }
                    : a
                ),
              };
            }
            return q;
          })
        );
      } else {
        logger.error("Failed to submit vote", response.message);
      }
    } catch (error) {
      logger.error("Error submitting vote", error);
    }
  };

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
        <Box display="flex" alignItems="center" gap={2}>
          {isLoading ? null : user ? (
            <>
              <IconButton onClick={handleNotificationClick}>
                <NotificationsIcon />
              </IconButton>
              <Menu
                anchorEl={notificationAnchorEl}
                open={notificationOpen}
                onClose={handleNotificationClose}
              >
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <MenuItem key={notification.id}>
                      <Typography variant="body2">
                        {notification.message}
                      </Typography>
                      <Button variant="text" onClick={() => {}}>
                        Accept Answer
                      </Button>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem>No notifications</MenuItem>
                )}
              </Menu>

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
          <Link href="/ask-questions" passHref>
            <Button variant="outlined">Add New Question</Button>
          </Link>
        </Box>

        {/* Question List */}
        {questions.map((q) => (
          <Box
            key={q.id}
            border="1px solid #ddd"
            borderRadius="10px"
            p={2}
            mb={2}
            bgcolor="#fff"
          >
            <Typography variant="h6" gutterBottom>
              {q.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }} color="text.secondary">
              {q.description}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
              {q.tags.map((tag) => (
                <Box
                  key={tag.id}
                  px={1.5}
                  py={0.5}
                  bgcolor="#e0e0e0"
                  borderRadius="5px"
                  fontSize="12px"
                >
                  {tag.name}
                </Box>
              ))}
            </Box>
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
              Asked by: <strong>{q.author.username}</strong>
            </Typography>
            {q.answers.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Answers:
                </Typography>
                {q.answers.map((answer) => (
                  <Box
                    key={answer.id}
                    border="1px solid #ddd"
                    borderRadius="5px"
                    p={1}
                    mb={1}
                    bgcolor="#f9f9f9"
                  >
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {answer.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Answered by: <strong>{answer.authorId}</strong>
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleVote(answer.id, 1)}
                      >
                        Upvote
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleVote(answer.id, -1)}
                      >
                        Downvote
                      </Button>
                      <Typography variant="body2">
                        Votes: {answer.voteCount}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            <Button
              variant="text"
              sx={{ mt: 1 }}
              onClick={() => handleAnswerClick(q.id)}
            >
              Answer
            </Button>
          </Box>
        ))}
      </Container>

      {/* Answer Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Answer the Question</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="Write your answer here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmitAnswer} variant="contained">
            Submit Answer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
