import { BASIC_ROUTE } from ".";

export const userRoutes = {
    getUserData: `${BASIC_ROUTE}/users/get-all`,
    updateUser: (userId: string) => `${BASIC_ROUTE}/users/update/${userId}`,
}