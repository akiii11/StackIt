"use client";

import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React from "react";
import { authClient } from "@/app/lib/auth/client";
import Link from "next/link";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = React.useCallback(
    async (values: LoginFormData): Promise<void> => {
      setIsPending(true);

      const { error } = await authClient.signInWithPassword(values);

      if (error) {
        setError("root", { type: "server", message: error });
        setIsPending(false);
        return;
      }
      setIsPending(false);
      router.replace("/");
      // UserProvider, for this case, will not refresh the router
      // After refresh, GuestGuard will handle the redirect
      router.refresh();
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
              Welcome Back!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Login to your account
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
                name="password"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.password)} fullWidth>
                    <InputLabel>Password</InputLabel>
                    <OutlinedInput {...field} label="Password" type="password" />
                    <FormHelperText>{errors.password?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

              <Button fullWidth variant="contained" type="submit" disabled={isPending}>
                Login
              </Button>
            </Stack>
          </form>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link href="/auth/register" style={{ fontWeight: "medium", color: "#1976d2" }}>
                Register
              </Link>
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
