import prisma from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/app/types/api-response";
import { Constants, ServerCodes } from "@/app/constants/constants";
import jwt from "jsonwebtoken";
import { JwtPayload } from "@/app/types/jwt-payload";

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
    console.log("Fetching notifications for userId:", userId);
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    console.log("Fetched notifications:", notifications);

    response.code = ServerCodes.Success;
    response.message = "Notifications fetched successfully.";
    response.data = notifications;

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    response.code = ServerCodes.UnknownError;
    response.message = "Unexpected error while fetching notifications.";
    return NextResponse.json(response, { status: 500 });
  }
}
