import prisma from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/app/types/api-response";
import { Constants, ServerCodes } from "@/app/constants/constants";
import jwt from "jsonwebtoken";
import Joi from "joi";
import { JwtPayload } from "@/app/types/jwt-payload";

const postValidation = Joi.object({
  title: Joi.string().min(5).required(),
  description: Joi.string().min(10).required(),
  tagIds: Joi.array().items(Joi.string()).default([]),
});

const putValidation = Joi.object({
  questionId: Joi.string().required(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
});

const deleteValidation = Joi.object({
  questionId: Joi.string().required(),
});

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
      response.message = "Authentication failed";
      return NextResponse.json(response, { status: 401 });
    }
  } catch {
    response.code = ServerCodes.AuthError;
    response.message = "JWT decode failed";
    return NextResponse.json(response, { status: 401 });
  }

  const body = await request.json();
  const { error, value } = postValidation.validate(body);
  if (error) {
    response.code = ServerCodes.ValidationError;
    response.message = error.details[0].message;
    return NextResponse.json(response, { status: 400 });
  }

  const { title, description, tagIds } = value;

  try {
    const newQuestion = await prisma.question.create({
      data: {
        title,
        description,
        authorId: userId,
        tags: {
          create: tagIds.map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
      include: {
        tags: { include: { tag: true } },
        author: { select: { id: true, username: true } },
      },
    });

    response.code = ServerCodes.Success;
    response.message = "Question created successfully";
    response.data = [newQuestion];
    return NextResponse.json(response, { status: 200 });
  } catch {
    response.message = "Database error while creating question";
    return NextResponse.json(response, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const response: ApiResponse = { code: ServerCodes.UnknownError };

  try {
    const url = new URL(request.url);
    const questionId = url.searchParams.get("questionId");

    if (questionId) {
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
          tags: { include: { tag: true } },
          author: { select: { id: true, username: true } },
          answers: {
            include: {
              author: { select: { id: true, username: true } },
              votes: true,
            },
          },
        },
      });

      if (!question) {
        response.code = ServerCodes.InvalidArgs;
        response.message = "Question not found";
        return NextResponse.json(response, { status: 404 });
      }

      response.code = ServerCodes.Success;
      response.message = "Question fetched successfully";
      response.data = [question];
    } else {
      const questions = await prisma.question.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          tags: { include: { tag: true } },
          author: { select: { id: true, username: true } },
          answers: true,
        },
      });

      response.code = ServerCodes.Success;
      response.message = "Questions fetched successfully";
      response.data = questions;
    }

    return NextResponse.json(response, { status: 200 });
  } catch {
    response.message = "Unexpected error while fetching questions";
    return NextResponse.json(response, { status: 500 });
  }
}

// UPDATE Question (Author only)
export async function PUT(request: NextRequest) {
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
      response.message = "Authentication failed";
      return NextResponse.json(response, { status: 401 });
    }
  } catch {
    response.code = ServerCodes.AuthError;
    response.message = "JWT decode failed";
    return NextResponse.json(response, { status: 401 });
  }

  const body = await request.json();
  const { error, value } = putValidation.validate(body);
  if (error) {
    response.code = ServerCodes.ValidationError;
    response.message = error.details[0].message;
    return NextResponse.json(response, { status: 400 });
  }

  const { questionId, title, description } = value;

  const existing = await prisma.question.findUnique({ where: { id: questionId } });
  if (!existing) {
    response.code = ServerCodes.InvalidArgs;
    response.message = "Question not found";
    return NextResponse.json(response, { status: 404 });
  }

  if (existing.authorId !== userId) {
    response.code = ServerCodes.AuthError;
    response.message = "You are not authorized to update this question";
    return NextResponse.json(response, { status: 403 });
  }

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: { title, description },
  });

  response.code = ServerCodes.Success;
  response.message = "Question updated";
  response.data = [updated];
  return NextResponse.json(response, { status: 200 });
}

export async function DELETE(request: NextRequest) {
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
      response.message = "Authentication failed";
      return NextResponse.json(response, { status: 401 });
    }
  } catch {
    response.code = ServerCodes.AuthError;
    response.message = "JWT decode failed";
    return NextResponse.json(response, { status: 401 });
  }

  const body = await request.json();
  const { error, value } = deleteValidation.validate(body);
  if (error) {
    response.code = ServerCodes.ValidationError;
    response.message = error.details[0].message;
    return NextResponse.json(response, { status: 400 });
  }

  const { questionId } = value;

  const existing = await prisma.question.findUnique({ where: { id: questionId } });
  if (!existing) {
    response.code = ServerCodes.InvalidArgs;
    response.message = "Question not found";
    return NextResponse.json(response, { status: 404 });
  }

  if (existing.authorId !== userId) {
    response.code = ServerCodes.AuthError;
    response.message = "You are not authorized to delete this question";
    return NextResponse.json(response, { status: 403 });
  }

  await prisma.question.delete({ where: { id: questionId } });

  response.code = ServerCodes.Success;
  response.message = "Question deleted";
  return NextResponse.json(response, { status: 200 });
}
