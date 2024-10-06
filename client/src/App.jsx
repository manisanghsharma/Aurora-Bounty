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
import toast, { Toaster } from "react-hot-toast";

const CONTRACT_ADDRESS = "0x390BdF96BE37813D2f078bbA98479545134151c6";

export default function CourseStore() {
	const [account, setAccount] = useState("");
	const [contract, setContract] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [purchasedCourses, setPurchasedCourses] = useState({});
	const [coursePrices, setCoursePrices] = useState({});

	useEffect(() => {
		connectWallet();

		// Add event listeners for account changes
		if (window.ethereum) {
			window.ethereum.on("accountsChanged", handleAccountChange);
		}

		// Cleanup function
		return () => {
			if (window.ethereum) {
				window.ethereum.removeListener("accountsChanged", handleAccountChange);
			}
		};
	}, []);

	useEffect(() => {
		if (contract && account) {
			checkPurchasedCourses();
			getCoursePrices();
		}
	}, [contract, account]);

	const handleAccountChange = async (accounts) => {
		if (accounts.length === 0) {
			// User disconnected their wallet
			setAccount("");
			setPurchasedCourses({});
			toast.error("Wallet disconnected");
		} else if (accounts[0] !== account) {
			// User switched accounts
			const newAccount = accounts[0];
			setAccount(newAccount);
			toast("Wallet account changed", {
				icon: "👛",
				description: `${newAccount.slice(0, 6)}...${newAccount.slice(-4)}`,
			});

			// Reconnect contract with new account
			if (window.ethereum) {
				const provider = new ethers.BrowserProvider(window.ethereum);
				const signer = await provider.getSigner();
				const contractInstance = new ethers.Contract(
					CONTRACT_ADDRESS,
					abi,
					signer
				);
				setContract(contractInstance);
			}
		}
	};

	const connectWallet = async () => {
		try {
			if (window.ethereum) {
				const connectToast = toast.loading("Connecting wallet...");

				const accounts = await window.ethereum.request({
					method: "eth_requestAccounts",
				});

				const provider = new ethers.BrowserProvider(window.ethereum);
				const signer = await provider.getSigner();

				const contractInstance = new ethers.Contract(
					CONTRACT_ADDRESS,
					abi,
					signer
				);

				setAccount(accounts[0]);
				setContract(contractInstance);

				toast.success("Wallet connected successfully", {
					id: connectToast,
					icon: "✅",
					description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
				});
			} else {
				toast.error("Please install MetaMask to use this app");
			}
		} catch (err) {
			toast.error("Failed to connect wallet: " + err.message);
		}
	};

	const checkPurchasedCourses = async () => {
		try {
			const courseAccessPromises = [1, 2, 3, 4, 5].map((courseId) =>
				contract.hasAccess(account, courseId)
			);

			const accessResults = await Promise.all(courseAccessPromises);

			const purchasedStatus = accessResults.reduce((acc, hasAccess, index) => {
				acc[index + 1] = hasAccess;
				return acc;
			}, {});

			setPurchasedCourses(purchasedStatus);
		} catch (err) {
			console.error("Error checking purchased courses:", err);
		}
	};

	const getCoursePrices = async () => {
		try {
			const pricePromises = [1, 2, 3, 4, 5].map((courseId) =>
				contract.getCoursePrice(courseId)
			);

			const prices = await Promise.all(pricePromises);

			const priceMap = prices.reduce((acc, price, index) => {
				acc[index + 1] = price;
				return acc;
			}, {});

			setCoursePrices(priceMap);
		} catch (err) {
			console.error("Error getting course prices:", err);
		}
	};

	const purchaseCourse = async (courseId) => {
		try {
			setLoading(true);
			const purchaseToast = toast.loading("Processing purchase...");

			const price = coursePrices[courseId];

			const tx = await contract.purchaseCourse(courseId, {
				value: price,
			});

			await tx.wait();

			// Update the purchased status for this course
			setPurchasedCourses((prev) => ({
				...prev,
				[courseId]: true,
			}));

			toast.success(`Successfully purchased course ${courseId}!`, {
				id: purchaseToast,
			});
		} catch (err) {
			toast.error("Failed to purchase course: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	const formatPrice = (price) => {
		if (!price) return "Loading...";
		return `${ethers.formatEther(price)} ETH`;
	};

	return (
		<div className='max-w-4xl mx-auto p-4'>
			<Toaster position='top-right' />
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
									<p className='text-gray-600 mb-2'>
										Price: {formatPrice(coursePrices[courseId])}
									</p>
									<button
										onClick={() => purchaseCourse(courseId)}
										disabled={loading || purchasedCourses[courseId]}
										className={`w-full p-2 rounded-md flex items-center justify-center ${
											purchasedCourses[courseId]
												? "bg-gray-300 text-gray-600 cursor-not-allowed"
												: "bg-green-500 text-white hover:bg-green-600"
										}`}
									>
										{loading ? (
											<>
												<Loader className='animate-spin mr-2' />
												Processing...
											</>
										) : purchasedCourses[courseId] ? (
											<>
												<CheckCircle2 className='mr-2' />
												Purchased
											</>
										) : (
											<>
												<ShoppingCart className='mr-2' />
												Buy Course
											</>
										)}
									</button>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
