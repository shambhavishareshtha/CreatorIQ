import {useEffect,useState} from 'react';
import {creatorService} from '../services/creatorService.js';
export function useAnalytics(filters){const[data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');useEffect(()=>{let active=true;setLoading(true);setError('');setData(null);creatorService.getAnalytics(filters).then(value=>{if(active)setData(value)}).catch(e=>{if(active){setError(e.message);setData(null)}}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[filters.range,filters.platform,filters.format,filters.topic]);return{data,loading,error}}

