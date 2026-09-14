import { useEffect, useState } from "react";

import {
    acceptGroupInvitation,
    declineGroupInvitation,
    getMyGroupInvitations,
    type GroupInvitation,
} from "../services/groupInvitationApi";

export default function GroupInvitations() {
    const [invitations, setInvitations] =
        useState<GroupInvitation[]>([]);

    useEffect(() => {
    loadInvitations();

    const handleNewInvitation = () => {
        loadInvitations();
        console.log("ASdf")
    };

    window.addEventListener(
        "group-invitation-received",
        handleNewInvitation
    );

    return () => {
        window.removeEventListener(
            "group-invitation-received",
            handleNewInvitation
        );
    };
}, []);

    const loadInvitations = async () => {
        try {
            const result =
                await getMyGroupInvitations();

            setInvitations(result);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAccept = async (
        invitationId: string
    ) => {
        try {
            await acceptGroupInvitation(
                invitationId
            );

            setInvitations((previous) =>
                previous.filter(
                    (item) =>
                        item._id !== invitationId
                )
            );

        } catch (error) {
            console.error(error);
        }
    };

    const handleDecline = async (
        invitationId: string
    ) => {
        try {
            await declineGroupInvitation(
                invitationId
            );

            setInvitations((previous) =>
                previous.filter(
                    (item) =>
                        item._id !== invitationId
                )
            );

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