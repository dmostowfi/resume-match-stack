import './App.css';
import * as React from 'react';
import { AppBar, Toolbar, Typography, Container, Paper, Stack, TextField, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';

const API_BASE = process.env.REACT_APP_API_BASE;

function App() {

  // these are the state variables
  const [jd, setJd] = React.useState(''); // sets the default job description to empty string
  const [k, setK] = React.useState(5);
  const [resume, setResume] = React.useState(''); /// not used yet 
  const [loading, setLoading] = React.useState(false); // true when waiting for API response
  const [result, setResult]   = React.useState(null); // holds the result from API call 
  const [error, setError]     = React.useState(null); // holds error message if any

  // call Node API, which calls FastAPI
  async function matchTopK() {
    // basic UI validation
    if (!jd || k < 1) return;

    // sets the UI state before the call - loading yes, no result or error yet
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const resp = await fetch(`${API_BASE}/fastapi/match-top-k`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, k })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || `HTTP ${resp.status}`);
      setResult(data.results);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <>
    <AppBar position="static">
        <Toolbar><Typography variant="h6">Resume Matcher</Typography></Toolbar>
    </AppBar>
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Match Candidates to a Job (Top-K)</Typography>
        <Stack spacing={2}>
          <TextField label="Job Description" multiline rows={4} variant="outlined" fullWidth value={jd} onChange={(e) => {setJd(e.target.value);}} />
          <Typography>Select Top K:</Typography>
          <ToggleButtonGroup 
            value={k} exclusive onChange={(e, val) => {setK(val);}}>
            <ToggleButton value={3}>3</ToggleButton>
            <ToggleButton value={5}>5</ToggleButton>
            <ToggleButton value={10}>10</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" onClick={matchTopK} color="primary" disabled={!jd || loading}>{loading ? 'Matching…' : 'Match Resumes'}</Button>

          {error && (
            <pre style={{ color: 'crimson' }}>
              {error}
            </pre>
          )}

          {result && (
            <ResultsList results={result} />
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>[Moving this to separate tab - need state for resume/jd]Direct Resume ↔ JD Match</Typography>
        <Stack spacing={2}>
          <TextField label="Resume Text" multiline minRows={4} placeholder="Paste resume…" />
          <TextField label="Job Description" multiline minRows={4} placeholder="Paste JD…" />
          <Button variant="outlined" onClick={() => console.log({ resume, jd })}>Score Pair</Button>
        </Stack>
      </Paper>
    </Container>
    </>
  );
}
function ResultsList({ results }) {
  console.log(results)
  return (
    <Stack spacing={2} sx={{ mt: 3 }}>
      {results.map((r, idx) => (
        <Paper key={idx} sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Candidate #{r.candidate_id}
          </Typography>

          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            Similarity: <strong>{(r.similarity * 100).toFixed(1)}%</strong>
          </Typography>

          <Typography variant="body2" sx={{ mt: 1 }}>
            {r.snippet}…
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}



export default App;
