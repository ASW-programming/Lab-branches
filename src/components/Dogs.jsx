import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const DOG_API = "https://dog.ceo/api/breeds/image/random/";

const fetchDogs = async () => {
	const res = await fetch(`${DOG_API}`);
	if (!res.ok) throw new Error("Kunde inte hämta hunden");
	const data = await res.json(); // ← await saknades
	return data;
};

const Dogs = () => {
	const {
		data: dogs,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["dogs"],
		queryFn: fetchDogs,
	});

	if (isLoading) return <p>Laddar...</p>;
	if (isError) return <p>Något gick fel</p>;

	return (
		<div>
			<img
				src={dogs.message} // ← dogs istället för dog
				alt="En hund"
				style={{ height: "100px", width: "100px" }}
			/>
		</div>
	);
};

export default Dogs;
