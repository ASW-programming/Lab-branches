import React from "react";
import { useQuery } from "@tanstack/react-query";

const DOG_API = "https://dog.ceo/api/breeds/image/random";

const fetchDog = async () => {
	const res = await fetch(DOG_API);
	if (!res.ok) throw new Error("Kunde inte hämta hunden");
	return await res.json();
};

const Dogs = ({ id }) => {
	// ← ta emot id som prop
	const {
		data: dogs,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["dogs", id], // ← unikt per rad
		queryFn: fetchDog,
	});

	if (isLoading) return <p>Laddar...</p>;
	if (isError) return <p>Något gick fel</p>;

	return (
		<div>
			<img
				src={dogs.message}
				alt="En hund"
				style={{ height: "100px", width: "100px" }}
			/>
		</div>
	);
};

export default Dogs;
