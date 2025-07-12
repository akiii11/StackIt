import prisma from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/app/types/api-response";
import { Constants, ServerCodes } from "@/app/constants/constants";
import jwt from "jsonwebtoken";
import { JwtPayload } from "@/app/types/jwt-payload";

export async function POST(request: NextRequest) {
  const response: ApiResponse = { code: ServerCodes.UnknownError };

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    response.code = ServerCodes.AuthError;
    response.message = "Authorization header is missing";
    return NextResponse.json(response, { status: 400 });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    response.code = ServerCodes.AuthError;
    response.message = "Token not provided";
    return NextResponse.json(response, { status: 400 });
  }

  let userId;
  try {
    const data = jwt.verify(token, Constants.SECRET_JWT_KEY) as JwtPayload;
    userId = data.userId;
    if (!userId) {
      response.code = ServerCodes.AuthError;
      response.message = "Authentication failed.";
      return NextResponse.json(response, { status: 400 });
    }
  } catch (err) {
    response.code = ServerCodes.AuthError;
    response.message = "JWT decode failed.";
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const { answerId, vote } = await request.json();

    if (!answerId || ![1, -1].includes(vote)) {
      response.code = ServerCodes.ValidationError;
      response.message = "Invalid vote data.";
      return NextResponse.json(response, { status: 400 });
    }

    const answer = await prisma.answer.findUnique({ where: { id: answerId } });

    if (!answer) {
      response.code = ServerCodes.InvalidArgs;
      response.message = "Answer not found.";
      return NextResponse.json(response, { status: 404 });
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: { voteCount: answer.voteCount + vote },
    });

    response.code = ServerCodes.Success;
    response.message = "Vote updated successfully.";
    response.data = [updatedAnswer];
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    response.code = ServerCodes.UnknownError;
    response.message = "Unexpected error while updating vote.";
    return NextResponse.json(response, { status: 500 });
  }
}
