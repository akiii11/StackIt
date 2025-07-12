import prisma from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ApiResponse } from "@/app/types/api-response";
import { ServerCodes } from "@/app/constants/constants";

const Joi = require("joi");
const postValidation = Joi.object({
  username: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

export async function POST(request: NextRequest) {
  const response: ApiResponse = { code: ServerCodes.UnknownError };
  try {
    const requestData = await request.json();
    const { error, value } = postValidation.validate(requestData);
    if (error) {
      response.code = ServerCodes.ValidationError;
      response.message = error.details[0].message;
      return NextResponse.json(response, { status: 400 });
    }
    let user;
    user = await prisma.user.findUnique({
      where: {
        email: requestData.email,
      },
    });
    if (user) {
      response.code = ServerCodes.InvalidArgs;
      response.message = "Email already exists.";
      return NextResponse.json(response, { status: 400 });
    }
    user = await prisma.user.findUnique({
      where: { username: requestData.username },
    });
    if (user) {
      response.code = ServerCodes.InvalidArgs;
      response.message = "Username not available.";
      return NextResponse.json(response, { status: 400 });
    }
    const { username, email, password } = value;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
    response.code = ServerCodes.Success;
    response.message = "User added successfully";
    response.data = [newUser];
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    response.code = ServerCodes.UnknownError;
    response.message = `Unknown Error (Code: ${response.code})`;
    return NextResponse.json(response, { status: 500 });
  }
}
