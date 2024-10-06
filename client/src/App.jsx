import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./contract/abi.json";
import {
	Wallet,
	ShoppingCart,
	AlertCircle,
	CheckCircle2,
	Loader,
} from "lucide-react";

const CONTRACT_ADDRESS = "0x390BdF96BE37813D2f078bbA98479545134151c6";

export default function CourseStore() {
	const [account, setAccount] = useState("");
	const [contract, setContract] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		connectWallet();
	}, []);

	const connectWallet = async () => {
		try {
			if (window.ethereum) {
				console.log("Ethereum object found");

				const accounts = await window.ethereum.request({
					method: "eth_requestAccounts",
				});
				console.log("Accounts:", accounts);

				const provider = new ethers.BrowserProvider(window.ethereum);
				const signer = await provider.getSigner();
				const contractInstance = new ethers.Contract(
					CONTRACT_ADDRESS,
					abi,
					signer
				);

				setAccount(accounts[0]);
				setContract(contractInstance);
				console.log("Wallet connected");
			} else {
				setError("Please install MetaMask to use this app");
				console.log("MetaMask not installed");
			}
		} catch (err) {
			setError("Failed to connect wallet: " + err.message);
			console.error("Error connecting wallet:", err);
		}
	};

	const purchaseCourse = async (courseId) => {
		try {
			setLoading(true);
			setError("");
			setSuccess("");

			const price = await contract.getCoursePrice(courseId);

			const tx = await contract.purchaseCourse(courseId, {
				value: price,
			});

			await tx.wait();

			setSuccess(`Successfully purchased course ${courseId}!`);
		} catch (err) {
			setError("Failed to purchase course: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='max-w-4xl mx-auto p-4'>
			<div className='bg-white rounded-lg shadow-md p-6'>
				<h1 className='text-2xl font-bold mb-4 flex items-center'>
					<ShoppingCart className='mr-2' /> SkillMint Course Store
				</h1>

				{!account ? (
					<button
						onClick={connectWallet}
						className='w-full bg-blue-500 text-white p-2 rounded-md flex items-center justify-center hover:bg-blue-600'
					>
						<Wallet className='mr-2' /> Connect Wallet
					</button>
				) : (
					<div>
						<p className='mb-4 flex items-center'>
							<Wallet className='mr-2' /> Connected Account:{" "}
							{account.slice(0, 6)}...{account.slice(-4)}
						</p>

						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{[1, 2, 3, 4, 5].map((courseId) => (
								<div key={courseId} className='border rounded-md p-4'>
									<h3 className='text-lg font-semibold mb-2'>
										Course {courseId}
									</h3>
									<button
										onClick={() => purchaseCourse(courseId)}
										disabled={loading}
										className='w-full bg-green-500 text-white p-2 rounded-md flex items-center justify-center hover:bg-green-600 disabled:bg-gray-300'
									>
										{loading ? (
											<Loader className='animate-spin mr-2' />
										) : (
											<ShoppingCart className='mr-2' />
										)}
										{loading ? "Processing..." : `Buy Course ${courseId}`}
									</button>
								</div>
							))}
						</div>

						{error && (
							<div className='mt-4 p-2 bg-red-100 text-red-700 rounded-md flex items-center'>
								<AlertCircle className='mr-2' /> {error}
							</div>
						)}

						{success && (
							<div className='mt-4 p-2 bg-green-100 text-green-700 rounded-md flex items-center'>
								<CheckCircle2 className='mr-2' /> {success}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
