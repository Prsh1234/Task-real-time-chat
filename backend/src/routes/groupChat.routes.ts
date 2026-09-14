import { Router } from "express";

import {
    authenticate,
} from "../middleware/auth.middleware.js";

import {
    createGroupChat,
    getGroup,
    getGroupList,
    getGroupMessages,
    searchUsersForGroup,
} from "../controllers/groupChat.controller.js";

import {
    acceptGroupInvitation,
    declineGroupInvitation,
    getMyGroupInvitations,
    inviteUserToGroup,
} from "../controllers/invitation.controller.js";

const router = Router();



router.post(
    "/create",
    authenticate,
    createGroupChat
);



router.get(
    "/",
    authenticate,
    getGroupList
);


router.get(
    "/invitations",
    authenticate,
    getMyGroupInvitations
);

router.patch<{ invitationId: string }>(
    "/invitations/:invitationId/accept",
    authenticate,
    acceptGroupInvitation
);

router.patch<{ invitationId: string }>(
    "/invitations/:invitationId/decline",
    authenticate,
    declineGroupInvitation
);



router.get<{ groupId: string }>(
    "/messages/:groupId",
    authenticate,
    getGroupMessages
);



router.get<{ groupId: string }>(
    "/:groupId/users/search",
    authenticate,
    searchUsersForGroup
);



router.post<{ groupId: string }>(
    "/:groupId/invitations",
    authenticate,
    inviteUserToGroup
);


router.get<{ id: string }>(
    "/:id",
    authenticate,
    getGroup
);


export default router;