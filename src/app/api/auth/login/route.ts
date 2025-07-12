import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import jwt from "jsonwebtoken";
import { Constants, ServerCodes } from "@/app/constants/constants";
import { ApiResponse } from "@/app/types/api-response";
import bcrypt from "bcryptjs";

const Joi = require("joi");
const postValidation = Joi.object({
  username: Joi.string().min(1).required(),
  password: Joi.string().min(1).required(),
});

export async function POST(request: NextRequest) {
  const response: ApiResponse = { code: ServerCodes.UnknownError };
  try {
    const requestData = await request.json();
    const { error, value } = postValidation.validate(requestData);
    if (error) {
      response.code = ServerCodes.AuthError;
      response.message = error.details[0].message;
      return NextResponse.json(response, { status: 400 });
    }
    const { username, password } = value;
    let user;
    user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      response.code = ServerCodes.InvalidArgs;
      response.message = "User not found";
      return NextResponse.json(response, { status: 400 });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      response.code = ServerCodes.InvalidArgs;
      response.message = "Incorrect Password.";
      return NextResponse.json(response, { status: 400 });
    }
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      Constants.SECRET_JWT_KEY,
      { expiresIn: "24h" }
    );
    response.code = ServerCodes.Success;
    response.message = "User logged in successfully.";
    response.data = [{ token, user }];
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    response.code = ServerCodes.UnknownError;
    response.message = `Unknown Error (Code: ${response.code})`;
    return NextResponse.json(response, { status: 500 });
  }
}
