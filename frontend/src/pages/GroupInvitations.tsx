import { useEffect, useState } from "react";

import {
    type GroupInvitation,
} from "../services/groupInvitationApi";
import { socket } from "../services/socket";
import type { GroupChat } from "../services/groupMessageApi";

interface GroupInvitationsProps {
    onGroupJoined: (group: GroupChat) => void;
}

export default function GroupInvitations({
    onGroupJoined,
}: GroupInvitationsProps) {
    const [invitations, setInvitations] =
        useState<GroupInvitation[]>([]);

    useEffect(() => {
        loadInvitations();

        const handleNewInvitation = () => {
            loadInvitations();
        };

        socket.on(
            "group_invitation",
            handleNewInvitation
        );

        return () => {
            socket.off(
                "group_invitation",
                handleNewInvitation
            );
        };
    }, []);


    const loadInvitations = async () => {
        try {
            socket.emit("invitations/get", 
                (response:{
                 success: boolean, 
                 message: string, 
                 invitations: GroupInvitation[] 
                }) => {
                if (response.success) {
                    setInvitations(response.invitations || []);
                } 
            });

        } catch (error) {
            console.error(error);
        }
    };

    const handleAccept = async (
        invitationId: string
    ) => {
        try {
            socket.emit("invitation/accept",
                {
                    invitationId
                },
                (response: {
                    success: boolean,
                    message: string,
                    group: GroupChat
                }) => {
                    if (response.success) {
                        setInvitations((previous) =>
                            previous.filter(
                                (item) => item._id !== invitationId
                            )
                        );

                        if (response.group) {
                            onGroupJoined(response.group);
                        }
                    }
                }
            )
        } catch (error) {
            console.error(error);
        }
    };

    const handleDecline = async (
        invitationId: string
    ) => {
        try {
            socket.emit("invitation/decline",
                {
                    invitationId
                },
                (response: {
                    success: boolean,
                    message: string
                }) => {
                    if (response.success) {
                        setInvitations((previous) =>
                            previous.filter(
                                (item) =>
                                    item._id !== invitationId
                            )
                        );
                    }
                }
            )

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-3">
            {invitations.map((invitation) => (
                <div
                    key={invitation._id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                >
                    <div>
                        <p className="font-medium">
                            {invitation.group.groupName}
                        </p>

                        <p className="text-sm text-slate-500">
                            Invited by{" "}
                            {invitation.inviter.name}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                handleAccept(
                                    invitation._id
                                )
                            }
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white"
                        >
                            Accept
                        </button>

                        <button
                            onClick={() =>
                                handleDecline(
                                    invitation._id
                                )
                            }
                            className="rounded-lg bg-red-500 border border-slate-300 px-3 py-2 text-sm text-white"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}