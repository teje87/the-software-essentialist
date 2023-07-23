import express, { Request, Response } from "express";
import prisma from "../conf/prismaClient";
import usernameAlreadyTakenException from "../exceptions/userNameAlreadyTakenException";
import { randomUUID } from "crypto";
import { ICreateUserResponse } from "./CreateUser/ICreateUserResponse";
import { ICreateUserRequest } from "./CreateUser/ICreateUserRequest";
import validationError from "../exceptions/validationError";
import { HttpStatusCode } from "../utils/enums/statusCode";
import { User } from "@prisma/client";
import emailAlreadyInUseException from "../exceptions/emailAlreadyInUseException";
import { IEditUserRequest } from "./EditUser/IEditUserRequest";
import { IEditUserResponse } from "./EditUser/IEditUserResponse";
import { userNotFoundException } from "../exceptions/userNotFoundException";

export class UserController {
  constructor() {}

  static async createUser(
    req: Request<{}, {}, ICreateUserRequest>,
    res: Response<ICreateUserResponse>
  ) {
    const email = req.body?.email;
    const lastName = req.body?.lastName;
    const firstName = req.body?.firstName;
    const username = req.body?.username;

    if (!email || !lastName || !firstName || !username) {
      return res.status(HttpStatusCode.BAD_REQUEST).send(validationError());
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username,
          },
          {
            email,
          },
        ],
      },
    });

    if (user?.username == username) {
      return res
        .status(HttpStatusCode.CONFLICT)
        .send(usernameAlreadyTakenException());
    }

    if (user?.email == email) {
      return res
        .status(HttpStatusCode.CONFLICT)
        .send(emailAlreadyInUseException());
    }

    const newUser: User = await prisma.user.create({
      data: {
        email,
        lastName,
        firstName,
        username,
        password: randomUUID(),
      },
    });

    res.status(HttpStatusCode.CREATED).send({
      data: {
        id: newUser.id,
        email: newUser.email,
        lastName: newUser.lastName,
        firstName: newUser.firstName,
        username: newUser.username,
      },
      success: true,
      error: undefined,
    });
  }

  static async editUser(
    req: Request<{ userId: string }, {}, IEditUserRequest>,
    res: Response<IEditUserResponse>
  ) {
    const userId = req.params?.userId;
    const email = req.body?.email;
    const lastName = req.body?.lastName;
    const firstName = req.body?.firstName;
    const username = req.body?.username;

    if (!email || !lastName || !firstName || !username || !userId) {
      return res.status(HttpStatusCode.BAD_REQUEST).send(validationError());
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });

    if (!user) {
      return res.status(HttpStatusCode.NOT_FOUND).send(userNotFoundException());
    }

    const userWithSameUsernameOrEmail = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username,
          },
          {
            email,
          },
        ],
        AND: [
          {
            NOT: {
              id: parseInt(userId),
            },
          },
        ],
      },
    });

    if (userWithSameUsernameOrEmail?.username == username) {
      return res
        .status(HttpStatusCode.CONFLICT)
        .send(usernameAlreadyTakenException());
    }

    if (userWithSameUsernameOrEmail?.email == email) {
      return res
        .status(HttpStatusCode.CONFLICT)
        .send(emailAlreadyInUseException());
    }

    const updatedUser: User = await prisma.user.update({
      where: {
        id: parseInt(userId),
      },
      data: {
        email,
        lastName,
        firstName,
        username,
      },
    });

    res.status(HttpStatusCode.OK).send({
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        lastName: updatedUser.lastName,
        firstName: updatedUser.firstName,
        username: updatedUser.username,
      },
      success: true,
      error: undefined,
    });
  }

  static async getUser(req: Request, res: Response) {
    res.send("update user");
  }
}
