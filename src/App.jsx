import { useState } from 'react'
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Rectangle } from 'recharts';

function App() {


	const [data, setData] = useState(() => { return JSON.parse(localStorage.getItem("entry")) || [] });
	const [filteredData, setFilteredData] = useState(data);
	const emojis = ['😞', '😕', '😐', '🙂', '😊', '😃', '😁', '😆', '🤩', '😍'];

	function SetDataTimeSpan(span) {
		const locale = undefined; // or e.g. "en-US" to force consistent format

		switch (span) {
			case "day": {
				const today = new Date().toLocaleDateString(locale);
				const dayData = data.filter(entry => entry.date.startsWith(today));
				setFilteredData(dayData);
				break;
			}

			case "week": {
				const now = new Date();
				const startOfWeek = new Date(now);
				startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
				startOfWeek.setHours(0, 0, 0, 0);

				const endOfWeek = new Date(startOfWeek);
				endOfWeek.setDate(startOfWeek.getDate() + 7);

				const weekData = data.filter(entry => {
					const entryDate = new Date(entry.date);
					return entryDate >= startOfWeek && entryDate < endOfWeek;
				});

				setFilteredData(weekData);
				break;
			}


			case "month": {
				const thisMonth = new Date().toLocaleDateString(locale, { year: 'numeric', month: '2-digit' });
				const monthData = data.filter(entry => {
					const entryMonth = new Date(entry.date).toLocaleDateString(locale, { year: 'numeric', month: '2-digit' });
					return entryMonth === thisMonth;
				});
				setFilteredData(monthData);
				break;
			}

			case "year": {
				const thisYear = new Date().getFullYear();
				const yearData = data.filter(entry => new Date(entry.date).getFullYear() === thisYear);
				setFilteredData(yearData);
				break;
			}

			case "all":
			default:
				setFilteredData(data);
				break;
		}
	}
	function signInWithGoogle()
	{
		
	}



	function handleSubmit(mood,comment) {
		return () => {
			const now = new Date();
			const formatted = now.toLocaleString();
			const entry = { date: formatted, mood: mood , comment: comment};

			// get previous data from local storage
			const data = JSON.parse(localStorage.getItem("entry")) || [];
			data.push(entry);

			localStorage.setItem("entry", JSON.stringify(data));
			console.log('Submitted mood:', entry);
			setData(data);
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
		return (
			<Border>
				<div className='flex flex-col items-center gap-5 bg-gray-800 p-5 rounded-xl '>
					<div className='flex flex-col items-center gap-10'>

						<div className='flex flex-col items-center gap-5'>
							<h1 className="text-3xl">How do you feel?</h1>
							<div className='flex'>
								<p className='text-xl me-4'>1</p>
								<input type='range' min='1' max='10' value={value} onChange={(e) => setValue(e.target.value)}></input>
								<p className='text-xl ms-4'>10</p>
							</div>
							<div className='flex flex-row '>
								<span className='text-5xl mx-2' title={value}>
									{emojis[value - 1]}
								</span>
							</div>
						</div>
						<button className='bg-gray-700 hover:bg-gray-500 p-2 rounded-xl' onClick={()=>setShowAdditionalInfo(!showAdditionalInfo)}><i className='fa fa-comment'></i></button>
						{(showAdditionalInfo || comment != "") &&

							<div className='flex flex-col items-center'>
								<textarea value={comment} onChange={(e)=>setComment(e.target.value)} className='bg-gray-900 rounded-xl p-4 w-75 text-gray-400 ' rows={4} placeholder='Additional info'></textarea>
							</div>
						}
					</div>
					<button onClick={handleSubmit(value,comment)} className='button'>Submit <i className='fa fa-arrow-right'></i></button>

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
						<button onClick={() => SetDataTimeSpan("all")} className='button'>all</button>
						<button onClick={() => SetDataTimeSpan("year")} className='button'>year</button>
						<button onClick={() => SetDataTimeSpan("month")} className='button'>month</button>
						<button onClick={() => SetDataTimeSpan("week")} className='button'>week</button>
						<button onClick={() => SetDataTimeSpan("day")} className='button'>day</button>
					</div>
					<LineChart width={600} height={300} data={filteredData}>
						<CartesianGrid strokeDasharray="3 3"/>
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
						<CartesianGrid strokeDasharray="3 3"/>
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

	return (
		<>
		<img className='m-2 h-8 w-8' onClick={signInWithGoogle} src='https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw'></img>
			<div className='gap-4 flex flex-col'>

				<Brand />
				<Input />
				<Graph />
			</div>
		</>
	)
}

export default App
