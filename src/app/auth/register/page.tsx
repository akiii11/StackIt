"use client";

import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SignUpRequestData } from "@/app/types/api-requests";
import React from "react";
import { authClient } from "@/app/lib/auth/client";

const registerSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const onSubmit = React.useCallback(
    async (values: RegisterFormData): Promise<void> => {
      setIsPending(true);
      const requestData: SignUpRequestData = {
        username: values.username,
        email: values.email,
        password: values.password,
      };
      const { error } = await authClient.signUp(requestData);

      if (error) {
        setError("root", { type: "server", message: error });
        setIsPending(false);
        return;
      }
      router.replace("/auth/login");
      setIsPending(false);
    },
    [router, setError]
  );

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ backgroundColor: "#f0f2f5", p: 2 }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 480 }}>
        <Stack spacing={3}>
          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold">
              👋 Welcome to Stackit!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your account to get started
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <Controller
                control={control}
                name="username"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.username)} fullWidth>
                    <InputLabel>Username</InputLabel>
                    <OutlinedInput {...field} label="Username" />
                    <FormHelperText>{errors.username?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.email)} fullWidth>
                    <InputLabel>Email</InputLabel>
                    <OutlinedInput {...field} label="Email" type="email" />
                    <FormHelperText>{errors.email?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.password)} fullWidth>
                    <InputLabel>Password</InputLabel>
                    <OutlinedInput
                      {...field}
                      label="Password"
                      type="password"
                    />
                    <FormHelperText>{errors.password?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormControl
                    error={Boolean(errors.confirmPassword)}
                    fullWidth
                  >
                    <InputLabel>Confirm Password</InputLabel>
                    <OutlinedInput
                      {...field}
                      label="Confirm Password"
                      type="password"
                    />
                    <FormHelperText>
                      {errors.confirmPassword?.message}
                    </FormHelperText>
                  </FormControl>
                )}
              />

              {errors.root && (
                <Alert severity="error">{errors.root.message}</Alert>
              )}

              <Button fullWidth variant="contained" type="submit">
                Register
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
