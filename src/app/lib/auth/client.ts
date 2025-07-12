"use client";

import { ApiNames, ServerCodes } from "@/app/constants/constants";

import { postData } from "../connection";
import { SignUpRequestData } from "@/app/types/api-requests";
import { ApiResponse } from "@/app/types/api-response";
import { Users } from "@/app/types/users";

function generateToken(): string {
  const arr = new Uint8Array(12);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v.toString(16).padStart(2, "0")).join("");
}

const user = {
  id: "",
  email: "",
  role: "",
  password: "",
  username: "",
  createdAt: "",
} satisfies Users;

export interface SignInWithOAuthParams {
  provider: "google" | "discord";
}

export interface SignInWithPasswordParams {
  username: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

class AuthClient {
  getToken(): string | null {
    return localStorage.getItem("custom-auth-token");
  }
  async signUp(requestData: SignUpRequestData): Promise<{ error?: string }> {
    const response: ApiResponse = await postData(ApiNames.Signup, requestData);
    if (response.code !== ServerCodes.Success) {
      return { error: response.message };
    }

    return {};
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: "Social authentication not implemented" };
  }

  async signInWithPassword(
    params: SignInWithPasswordParams
  ): Promise<{ error?: string }> {
    const { username, password } = params;

    const response: ApiResponse = await postData(ApiNames.Login, params);
    if (response.code !== ServerCodes.Success) {
      return { error: response.message };
    }
    let token = null;
    if (response.data != null) {
      token = response.data[0].token;
      let user = response.data[0].user;
      localStorage.setItem("custom-auth-token", token);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      return { error: response.message };
    }
    return {};
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: "Password reset not implemented" };
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: "Update reset not implemented" };
  }

  async getUser(): Promise<{ data?: Users | null; error?: string }> {
    // Make API request

    // We do not handle the API, so just check if we have a token in localStorage.
    const token = localStorage.getItem("custom-auth-token");

    if (!token) {
      return { data: null };
    }

    return { data: user };
  }

  async signOut(): Promise<{ error?: string }> {
    localStorage.removeItem("custom-auth-token");

    return {};
  }
}

export const authClient = new AuthClient();
