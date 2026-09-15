import api from "./api";

export interface GroupUser {
    _id: string;
    name: string;
    email: string;
}

export interface GroupInvitation {
    _id: string;
    group: {
        _id: string;
        groupName: string;
    };
    inviter: {
        _id: string;
        name: string;
        email: string;
    };
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    createdAt: string;
}

export const searchGroupUsers = async (
    groupId: string,
    query: string
) => {
    const response = await api.get(
        `/groupChat/${groupId}/users/search`,
        {
            params: {
                q: query,
            },
        }
    );

    return response.data.users as GroupUser[];
};



export const getMyGroupInvitations = async () => {
    const response = await api.get(
        "/groupChat/invitations"
    );

    return response.data
        .invitations as GroupInvitation[];
};

export const acceptGroupInvitation = async (
    invitationId: string
) => {
    const response = await api.patch(
        `/groupChat/invitations/${invitationId}/accept`
    );

    return response.data;
};

export const declineGroupInvitation = async (
    invitationId: string
) => {
    const response = await api.patch(
        `/groupChat/invitations/${invitationId}/decline`
    );

    return response.data;
};