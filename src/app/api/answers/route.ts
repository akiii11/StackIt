import prisma from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/app/types/api-response";
import { Constants, ServerCodes } from "@/app/constants/constants";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { JwtPayload } from "@/app/types/jwt-payload";

const postValidation = Joi.object({
  content: Joi.string().min(1).required(),
  questionId: Joi.string().required(),
  authorId: Joi.string().required(),
});

const putValidation = Joi.object({
  answerId: Joi.string().required(),
  content: Joi.string().min(1).required(),
});

const deleteValidation = Joi.object({
  answerId: Joi.string().required(),
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
    response.message = "Token not provided.";
    return NextResponse.json(response, { status: 400 });
  }
  let userId;
  try {
    const data = jwt.verify(token, Constants.SECRET_JWT_KEY) as JwtPayload;
    if (data.userId) {
      userId = data.userId;
    } else {
      response.code = ServerCodes.AuthError;
      response.message = "Authentication failed";
      return NextResponse.json(response, { status: 400 });
    }
  } catch (error) {
    response.code = ServerCodes.AuthError;
    response.message = "Authentication failed. Json decode failure.";
    return NextResponse.json(response, { status: 500 });
  }
  try {
    if (!userId) {
      response.message = "Invalid User";
    }
    const requestData = await request.json();
    const { error, value } = postValidation.validate(requestData);
    if (error) {
      response.code = ServerCodes.ValidationError;
      response.message = error.details[0].message;
      return NextResponse.json(response, { status: 400 });
    }

    const { content, questionId, authorId } = value;
    const questionExists = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!questionExists) {
      response.code = ServerCodes.InvalidArgs;
      response.message = "Invalid question ID.";
      return NextResponse.json(response, { status: 404 });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: authorId },
    });

    if (!userExists) {
      response.code = ServerCodes.InvalidArgs;
      response.message = "Invalid author ID.";
      return NextResponse.json(response, { status: 404 });
    }
    const newAnswer = await prisma.answer.create({
      data: {
        content,
        questionId,
        authorId,
      },
    });

    response.code = ServerCodes.Success;
    response.message = "Answer added successfully";
    response.data = [newAnswer];
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    response.code = ServerCodes.UnknownError;
    response.message = `Unknown Error (Code: ${response.code})`;
    return NextResponse.json(response, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
    const url = new URL(request.url);
    const questionId = url.searchParams.get("questionId");

    if (!questionId) {
      response.code = ServerCodes.ValidationError;
      response.message = "questionId is required.";
      return NextResponse.json(response, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      response.code = ServerCodes.InvalidArgs;
      response.message = "Invalid question ID.";
      return NextResponse.json(response, { status: 404 });
    }

    const answers = await prisma.answer.findMany({
      where: { questionId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true },
        },
        votes: true,
      },
    });

    response.code = ServerCodes.Success;
    response.message = "Answers fetched successfully.";
    response.data = answers;

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    response.code = ServerCodes.UnknownError;
    response.message = `Unexpected error while fetching answers.`;
    return NextResponse.json(response, { status: 500 });
  }
}

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
    if (data.userId) {
      userId = userId;
    } else {
      response.code = ServerCodes.AuthError;
      response.message = "Authorization failed";
      return NextResponse.json(response, { status: 400 });
    }
  } catch (error) {
    response.code = ServerCodes.AuthError;
    response.message = "Authorization failed: JSON decode failure";
    return NextResponse.json(response, { status: 400 });
  }

  const requestData = await request.json();
  const { error, value } = putValidation.validate(requestData);

  if (error) {
    response.code = ServerCodes.ValidationError;
    response.message = error.details[0].message;
    return NextResponse.json(response, { status: 400 });
  }

  const { answerId, content } = value;

  const existingAnswer = await prisma.answer.findUnique({
    where: { id: answerId },
  });

  if (!existingAnswer) {
    response.code = ServerCodes.InvalidArgs;
    response.message = "Answer not found";
    return NextResponse.json(response, { status: 404 });
  }

  if (existingAnswer.authorId !== userId) {
    response.code = ServerCodes.AuthError;
    response.message = "You are not authorized to update this answer";
    return NextResponse.json(response, { status: 403 });
  }

  const updatedAnswer = await prisma.answer.update({
    where: { id: answerId },
    data: { content },
  });

  response.code = ServerCodes.Success;
  response.message = "Answer updated successfully";
  response.data = [updatedAnswer];
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
    if (data.userId) {
      userId = userId;
    } else {
      response.code = ServerCodes.AuthError;
      response.message = "Authorization failed";
      return NextResponse.json(response, { status: 400 });
    }
  } catch (error) {
    response.code = ServerCodes.AuthError;
    response.message = "Authorization failed: JSON decode failure";
    return NextResponse.json(response, { status: 400 });
  }
  try {
    const requestData = await request.json();
    const { error, value } = deleteValidation.validate(requestData);
    if (error) {
      response.code = ServerCodes.ValidationError;
      response.message = error.details[0].message;
      return NextResponse.json(response, { status: 400 });
    }
    const { answerId } = value;
    if (!answerId) {
      response.code = ServerCodes.ValidationError;
      response.message = "Answer ID is required";
      return NextResponse.json(response, { status: 400 });
    }
    const existingAnswer = await prisma.answer.findUnique({
      where: { id: answerId },
    });

    if (!existingAnswer) {
      response.code = ServerCodes.InvalidArgs;
      response.message = "Answer not found";
      return NextResponse.json(response, { status: 404 });
    }

    if (existingAnswer.authorId !== userId) {
      response.code = ServerCodes.AuthError;
      response.message = "You are not authorized to delete this answer";
      return NextResponse.json(response, { status: 403 });
    }

    await prisma.answer.delete({
      where: { id: answerId },
    });

    response.code = ServerCodes.Success;
    response.message = "Answer deleted successfully";
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    response.code = ServerCodes.UnknownError;
    response.message = `Unknown Error( Error Code: ${response.code})`;
    return NextResponse.json(response, { status: 500 });
  }
}
