import { useState, useEffect } from 'react'
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Rectangle } from 'recharts';
import { createClient } from '@supabase/supabase-js';


const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY,);

function App() {

	const fetchUserData = async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error) {
			console.log("error:", error);
			return;
		}
		const user = data.user;
		const fullName = user.user_metadata.full_name;
		const avatarUrl = user.user_metadata.avatar_url;
		const userId = user.id;


		return { user_id: userId, full_name: fullName, avatar_url: avatarUrl }
	}
	// create supabase client

	const [userData, setUserData] = useState(null)
	const [data, setData] = useState([]);
	const [filteredData, setFilteredData] = useState(data);
	const emojis = ['😞', '😕', '😐', '🙂', '😊', '😃', '😁', '😆', '🤩', '😍'];

	// ANALYSIS
	const [median, setMedian] = useState(null);
	const [mean, setMean] = useState(null);
	const [variance, setVariance] = useState(null);
	const [stability, setStability] = useState(null);
	const [trend, setTrend] = useState(null);

	function SetDataTimeSpan(span, _data) {
		// Clone data and add a parsed Date for easier filtering
		const data = _data.map(entry => ({
			...entry,
			_parsedDate: new Date(entry.date)
		}));

		let filtered = [];

		switch (span) {
			case "day": {
				const today = new Date();
				filtered = data.filter(entry =>
					entry._parsedDate.toDateString() === today.toDateString()
				);
				break;
			}

			case "week": {
				const now = new Date();
				const startOfWeek = new Date(now);
				startOfWeek.setDate(now.getDate() - now.getDay());
				startOfWeek.setHours(0, 0, 0, 0);

				const endOfWeek = new Date(startOfWeek);
				endOfWeek.setDate(startOfWeek.getDate() + 7);

				filtered = data.filter(entry =>
					entry._parsedDate >= startOfWeek && entry._parsedDate < endOfWeek
				);
				break;
			}

			case "month": {
				const now = new Date();
				const thisMonth = now.getMonth();
				const thisYear = now.getFullYear();
				filtered = data.filter(entry =>
					entry._parsedDate.getMonth() === thisMonth &&
					entry._parsedDate.getFullYear() === thisYear
				);
				break;
			}

			case "year": {
				const thisYear = new Date().getFullYear();
				filtered = data.filter(entry =>
					entry._parsedDate.getFullYear() === thisYear
				);
				break;
			}

			case "all":
			default:
				filtered = data;
				break;
		}

		setFilteredData(filtered);
	}




	useEffect(() => {
		const loadUserAndData = async () => {
			const userData = await fetchUserData();
			if (userData) {
				setUserData(userData);

				const data = await handleGetData(userData.user_id);
				if (data) {
					setData(data);
					SetDataTimeSpan("day", data);
				}
			}
		}
		// FIRST GET USER // THEN GET DATA BASED ON USERID
		loadUserAndData();
	}, []);

	useEffect(() => {
		const moods = filteredData.map(entry => Number(entry.mood)).filter(n => !isNaN(n));
		if (moods.length > 0) {
			setMedian(calculateMedian(moods));
			setVariance(calculateVariance(moods));
			setMean(calculateMean(moods));
			setStability(calculateStability(moods));
			setTrend(calculateTrend(moods));
		}
	}, [filteredData]);

	function calculateTrend(data) {
		const N = data.length;
		if (N === 0) return 0;

		const x = [...Array(N).keys()]; // 0,1,2,...
		const y = data;

		const sumX = x.reduce((a, b) => a + b, 0);
		const sumY = y.reduce((a, b) => a + b, 0);
		const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
		const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

		const numerator = N * sumXY - sumX * sumY;
		const denominator = N * sumX2 - sumX * sumX;

		if (denominator === 0) return 0;

		const slope = numerator / denominator;

		let slopeString = "";

		if (slope > 0.1) {
			slopeString = "Improving";
		}
		if (slope < -0.1) {
			slopeString = "Declining";
		}

		return slopeString;
	}

	function calculateMedian(arr) {
		const sorted = [...arr].sort((a, b) => a - b); // sort ascending
		const mid = Math.floor(sorted.length / 2);

		if (sorted.length % 2 === 0) {
			// average of two middle values for even-length array
			return (sorted[mid - 1] + sorted[mid]) / 2;
		} else {
			// middle value for odd-length array
			return sorted[mid];
		}
	}

	function calculateMean(data) {
		const n = data.length;
		if (n === 0) return 0;

		const mean = data.reduce((sum, val) => sum + val, 0) / n;

		return mean;
	}

	function calculateVariance(data) {
		const n = data.length;
		if (n === 0) return 0;

		const mean = data.reduce((sum, val) => sum + val, 0) / n;
		const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;

		return variance;
	}

	function lerpColor(color1, color2, t) {
		// color1 and color2 are {r,g,b} objects, t is 0..1
		const r = Math.round(color1.r + (color2.r - color1.r) * t);
		const g = Math.round(color1.g + (color2.g - color1.g) * t);
		const b = Math.round(color1.b + (color2.b - color1.b) * t);
		return `rgb(${r},${g},${b})`;
	}

	function getMoodColor(value) {
		if (value <= 5) {
			// interpolate from red to blue
			const t = (value - 1) / (5 - 1); // normalize between 0–1
			return lerpColor({ r: 255, g: 0, b: 0 }, { r: 0, g: 150, b: 255 }, t);
		} else {
			// interpolate from blue to green
			const t = (value - 5) / (10 - 5); // normalize between 0–1
			return lerpColor({ r: 0, g: 0, b: 255 }, { r: 0, g: 255, b: 0 }, t);
		}
	}

	function calculateStability(_data) {
		const variance = calculateVariance(_data);
		let stability = "Stable";

		if (variance < 5) stability = "Stable";
		else if (variance < 10) stability = "Unstable";
		else stability = "Extremely unstable";

		return stability;
	}

	async function handleGetData(user_id) {
		console.log('user_id:', user_id);
		if (user_id) {
			const { data, error } = await supabase.from('entries').select('*').eq('user_id', user_id);
			if (error) {
				console.error(error);
				return null;
			}
			const convertedData = data.map(row => ({
				date: row.created_at,
				user_id: row.user_id,
				mood: row.mood,
				comment: row.comment

			}))
			return convertedData;
		}
		else {
			return JSON.parse(localStorage.getItem("entry"))
		}
	}

	function handleSubmit(mood, comment) {
		return async () => {
			const now = new Date();
			const formatted = now.toLocaleString();
			const entry = { date: formatted, mood: mood, comment: comment };

			const supabaseEntry = { created_at: formatted, user_id: userData.user_id, mood: mood, comment: comment };

			if (userData) {
				const { data, error } = await supabase.from('entries').insert(supabaseEntry).select();
				if (error) {
					console.error(error);
					return;
				}

				// state
				const newEntry = data.map(row => ({
					date: row.created_at,
					user_id: row.user_id,
					mood: row.mood,
					comment: row.comment
				}));

				setData(prev => [...prev, ...newEntry]);
			}
			else {
				// get previous data from local storage
				const data = JSON.parse(localStorage.getItem("entry")) || [];
				data.push(entry);
				localStorage.setItem("entry", JSON.stringify(data));
				console.log('Submitted mood to localstorage:', entry);
				setData(data);
			}
		}
	}

	function Brand() {
		return (
			<Border>
				<div className='flex flex-col  bg-gray-800 rounded-xl'>
					<h1 className="text-9xl font-bold bg-clip-text text-transparent bg-linear-to-r  from-red-500 via-green-500 to-blue-500">MoodMap</h1>
				</div>
			</Border>
		)
	}

	function Border({ children }) {
		return (<div className='p-[3px] rounded-xl bg-linear-to-r from-red-500 via-green-500 to-blue-500 drop-shadow-2xl'><div className='bg-zinc-900 rounded-lg p-2'>{children}</div></div>)
	}

	function Input() {
		const [value, setValue] = useState(5);
		const [comment, setComment] = useState("");
		const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
		const valueColor = getMoodColor(value);
		return (
			<Border>
				<div className='flex flex-col items-center gap-5 bg-gray-800 p-5 rounded-xl '>
					<div className='flex flex-col items-center gap-10'>
						<div className='flex flex-col items-center gap-5'>
							<h1 className="text-gray-300 font-bold text-2xl">How are you feeling?</h1>
							<div className='flex'>
								<p className='text-xl me-4 text-red-500'>Bad</p>
								<input type='range' min='1' max='10' value={value} onChange={(e) => setValue(e.target.value)}></input>
								<p className='text-xl ms-4 text-green-500'>Good</p>
							</div>
							<div className='flex flex-row '>
								<h1 className='text-5xl font-bold' style={{ "color": valueColor }}> {value}</h1>
								<span className={`text-5xl mx-2 `} title={value}>
									{emojis[value - 1]}
								</span>
							</div>
						</div>
					</div>
					<div className='flex flex-col items-center gap-5'>
						<button className='bg-gray-700 hover:bg-gray-500 p-2 rounded-xl' onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}><i className='fa fa-comment'></i></button>
						{(showAdditionalInfo || comment != "") &&

							<div className='flex flex-col items-center'>
								<textarea value={comment} onChange={(e) => setComment(e.target.value)} className='bg-gray-900 rounded-xl p-4 w-75 text-gray-400 ' rows={4} placeholder='Additional info'></textarea>
							</div>
						}
					</div>
					<div className='flex flex-col gap-5'>
						<button onClick={handleSubmit(value, comment)} className='button'>Submit <i className='fa fa-arrow-right'></i></button>
					</div>
				</div>
			</Border>
		)
	}

	function Analysis() {
		return (
			<Border>
				<div className='flex flex-col bg-gray-800 p-4 gap-5 rounded-xl'>
					<h1 className='text-gray-300 font-bold text-2xl'>Analysis </h1>
					<div className='flex flex-col bg-gray-900 p-4 rounded-xl items-start'>
						{data.length === 0 && <h1 className='text-xl'>No data points yet. Start tracking to see your analysis here.</h1> }
						{variance && <h1 className='text-xl'>Standard deviation: {Math.sqrt(variance).toFixed(1)}</h1>}
						{median && <h1 className='text-xl'>Median: {median}</h1>}
						{mean && <h1 className='text-xl'>Mean: {mean.toFixed(1)}</h1>}
						{stability && <h1 className='text-xl'>Stability: {stability}</h1>}
						{trend && <h1 className='text-xl'>Trend: {trend}</h1>}
					</div>
				</div>
			</Border>
		)

	}

	function Graph() {
		return (
			<Border>
				<div className='bg-gray-800 rounded-xl flex items-center justify-center flex-col gap-5 p-4'>
					<p className='text-gray-300 font-bold text-2xl'>Mood history</p>
					<p className='text-gray-400'>Data points: {data.length}</p>
					<div className='flex gap-2'>
						<button onClick={() => SetDataTimeSpan("all", data)} className='button'>all</button>
						<button onClick={() => SetDataTimeSpan("year", data)} className='button'>year</button>
						<button onClick={() => SetDataTimeSpan("month", data)} className='button'>month</button>
						<button onClick={() => SetDataTimeSpan("week", data)} className='button'>week</button>
						<button onClick={() => SetDataTimeSpan("day", data)} className='button'>day</button>
					</div>
					<LineChart width={600} height={300} data={filteredData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="date" /><YAxis width="auto" /><Tooltip content={CustomTooltip} /><Legend />
						<Line type="monotone" dataKey="mood" stroke="#8884d8" strokeWidth={3} />
					</LineChart>
				</div>
			</Border>
		)
	}

	function Graph2() {
		return (
			<Border>
				<div className='bg-gray-800 rounded-xl flex items-center justify-center flex-col gap-5 p-4'>
					<p className='text-gray-300 font-bold text-2xl'>Mood history</p>
					<p className='text-gray-400'>Data points: {data.length}</p>
					<div className='flex gap-2'>
						<button onClick={() => SetDataTimeSpan("all")} className='button'>all</button>
						<button onClick={() => SetDataTimeSpan("year")} className='button'>year</button>
						<button onClick={() => SetDataTimeSpan("month")} className='button'>month</button>
						<button onClick={() => SetDataTimeSpan("week")} className='button'>week</button>
						<button onClick={() => SetDataTimeSpan("day")} className='button'>day</button>
					</div>
					<BarChart width={600} height={300} data={filteredData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKeys="date" /><YAxis width="auto" /><Tooltip content={CustomTooltip} /><Legend />
						<Bar dataKey="mood" stroke="#8884d8" fill='#8004d8' activeBar={<Rectangle fill="pink" stroke="blue" />} />
					</BarChart>
				</div>
			</Border>
		)
	}

	const CustomTooltip = ({ active, payload, label }) => {
		const isVisible = active && payload && payload.length;
		return (
			<div className="custom-tooltip" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
				{isVisible && (
					<>
						<div className='bg-gray-700 p-2 rounded-lg w-50'>
							<p className="label">{`Date: ${label}`}</p>
							<p className="label">{`Mood: ${payload[0].value}`}</p>
							<p className="label">{`Comment: ${payload[0].payload?.comment ?? "none"}`}</p>
							<span className='text-5xl mx-2' title={payload[0].value}>
								{emojis[payload[0].value - 1]}
							</span>
						</div>
					</>
				)}
			</div>
		);
	};

	const UserBar = () => {
		const signInWithGoogle = async () => {
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: window.location.origin + '/moodmap_react/',
				},
			});
		}
		const signOut = async () => {
			const { data, error } = await supabase.auth.signOut();
			if (error) {
				console.log('Error:', error);
			}
			setUserData(null);
			setFilteredData(null);
		}
		return (
			<Border>
				{!userData &&
					<>
						<div className='bg-gray-800 rounded-xl p-2 flex flex-col items-center gap-2 content-center justify-center'>
							<div className='p-2 flex items-center gap-2 content-center justify-center'>
								<p className='text-xl'> Sign in </p>
								<img className='m-2 h-8 w-8 hover:cursor-pointer' onClick={signInWithGoogle} src='https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw'></img>
							</div>
							<p className='pb-2 text-md text-gray-400'>Sign in to sync your data across all your devices.</p>
						</div>
					</>
				}
				{userData &&
					<>
						<div className='bg-gray-800 rounded-xl p-2 flex items-center gap-2 place-content-between'>
							<button title='Sign out' onClick={signOut} className='button p-2! rounded-full!'> <i className='fa fa-sign-out '></i></button>
							<h1 className='text-gray-300 font-bold text-2xl '>Hello {userData.full_name}</h1>
							<img className='rounded-xl border-3 w-12 border-b-green-500 border-l-yellow-500 border-t-red-500 border-r-blue-500' src={userData.avatar_url}></img>
						</div>
					</>
				}
			</Border>
		)
	}
	return (
		<>
			<div className='gap-4 flex flex-col'>
				<Brand />
				<UserBar />
				<Input />
				<Graph />
				<Analysis />
			</div>
		</>
	)
}

export default App
