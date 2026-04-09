import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Dogs from "./Dogs";

const API_BASE = "https://api-userapi.onrender.com/api/users";
const API_KEY = "elev-hemlighet-2026";

// --- API FUNKTIONER ---

const fetchUsers = async () => {
	const res = await fetch(`${API_BASE}/getUsers`, {
		method: "GET",
		headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
	});
	if (!res.ok) throw new Error("Kunde inte hämta användare");
	return res.json();
};

const createUserApi = async (newUser) => {
	const res = await fetch(`${API_BASE}/createUser`, {
		method: "POST",
		headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
		body: JSON.stringify(newUser),
	});
	if (!res.ok) throw new Error("Kunde inte skapa användare");
	return res.json();
};

const updateUserApi = async (user) => {
	const res = await fetch(`${API_BASE}/updateUser/${user.id}`, {
		method: "PUT",
		headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
		body: JSON.stringify({ name: user.name, role: user.role }),
	});
	if (!res.ok) throw new Error("Kunde inte uppdatera användare");
	return res.json();
};

const deleteUserApi = async (id) => {
	const res = await fetch(`${API_BASE}/removeUser/${id}`, {
		method: "DELETE",
		headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
	});
	if (!res.ok) throw new Error("Kunde inte ta bort användare");
	return res.json();
};

// --- KOMPONENT ---

export default function Users() {
	const queryClient = useQueryClient();

	// Vi använder en lokal state för att hantera textinmatning utan att trigga API:et direkt

	const [addNameInput, setAddNameInput] = useState("");
	const [addRoleInput, setAddRoleInput] = useState("Pilot");

	const {
		data: users,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["users"],
		queryFn: fetchUsers,
	});

	// 1. SKAPA (POST) - Optimistisk
	const createMutation = useMutation({
		mutationFn: createUserApi,
		onMutate: async (newUser) => {
			await queryClient.cancelQueries({ queryKey: ["users"] });

			const previousUsers = queryClient.getQueryData(["users"]);

			queryClient.setQueryData(["users"], (old) => [
				...(old || []),
				newUser,
			]);

			return { previousUsers };
		},
		onError: (err, newUser, context) => {
			queryClient.setQueryData(["users"], context.previousUsers);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});

	// 2. UPPDATERA (PUT) - Optimistisk
	const updateMutation = useMutation({
		mutationFn: updateUserApi,
		onMutate: async (updatedUser) => {
			await queryClient.cancelQueries({ queryKey: ["users"] });

			const previousUsers = queryClient.getQueryData(["users"]);

			queryClient.setQueryData(["users"], (old) =>
				old?.map((u) =>
					u.id === updatedUser.id ? { ...u, ...updatedUser } : u,
				),
			);

			return { previousUsers };
		},
		onError: (err, updatedUser, context) => {
			queryClient.setQueryData(["users"], context.previousUsers);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});

	// 3. TA BORT (DELETE) - Optimistisk
	const deleteMutation = useMutation({
		mutationFn: deleteUserApi,
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: ["users"] });

			const previousUsers = queryClient.getQueryData(["users"]);

			// Sätt listan till en ny array med datan som fanns och kollar om id i listan inte är samma som id med den vi vill ta bort.
			// Filtrerar bort den som vi försökte ta bort
			queryClient.setQueryData(["users"], (old) =>
				old?.filter((u) => u.id !== id),
			);

			return { previousUsers };
		},
		onError: (err, id, context) => {
			queryClient.setQueryData(["users"], context.previousUsers);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});

	if (isLoading)
		return (
			<div className="p-10 text-xl animate-pulse text-blue-600">
				Laddar användare...
			</div>
		);
	if (isError)
		return (
			<div className="p-10 text-red-500">
				Ett fel uppstod vid hämtning!
			</div>
		);

	return (
		<div className="p-8 max-w-2xl mx-auto font-sans">
			<h1 className="text-3xl font-bold mb-6 text-white-800">
				User Management (Optimistic UI)
			</h1>
			{/* ADD USER SECTION */}
			<div className="mb-6">
				<input
					value={addNameInput}
					onChange={(e) => setAddNameInput(e.target.value)}
					placeholder="Namn"
					className="border-b mr-2"
				/>
				<select
					value={addRoleInput}
					onChange={(e) => setAddRoleInput(e.target.value)}>
					<option value="Pilot">Pilot</option>
					<option value="Engineer">Engineer</option>
					<option value="User">User</option>
				</select>
				<button
					onClick={() => {
						createMutation.mutate({
							name: addNameInput,
							role: addRoleInput,
						});
						setAddNameInput("");
					}}
					className="ml-8 border-2 p-2">
					Lägg till
				</button>
			</div>

			{/* LIST SECTION */}
			<div className="grid gap-4">
				{users?.map((user) => (
					<div
						key={user.id}
						className="flex gap-4 p-4 border rounded">
						{/* Vi använder ett enkelt formulär per rad för att undvika lokal state */}
						<Dogs id={user.id} />
						<form
							onSubmit={(e) => {
								e.preventDefault();
								const formData = new FormData(e.target);
								updateMutation.mutate({
									id: user.id,
									name: formData.get("name"),
									role: formData.get("role"),
								});
							}}
							className="flex-1 flex gap-2 justify-between">
							<input
								name="name"
								defaultValue={user.name}
								className="border-b"
							/>
							<input
								name="name"
								defaultValue={user.role}
								className="border-b"
							/>

							<button
								type="submit"
								className="bg-green-500 text-white px-2">
								Spara
							</button>
						</form>

						<button
							onClick={() => deleteMutation.mutate(user.id)}
							className="text-red-500">
							✕
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
