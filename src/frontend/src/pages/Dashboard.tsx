import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Divider,
  Paper,
} from '@mui/material'
import BiotechIcon from '@mui/icons-material/Biotech'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import SecurityIcon from '@mui/icons-material/Security'
import InsightsIcon from '@mui/icons-material/Insights'
import VerifiedIcon from '@mui/icons-material/Verified'
import ScienceIcon from '@mui/icons-material/Science'

const FEATURES = [
  {
    icon: <InsightsIcon sx={{ fontSize: 32, color: '#1565C0' }} />,
    title: 'PRR-Based Signal Detection',
    desc: 'Proportional Reporting Ratio computed from live FAERS adverse event data.',
  },
  {
    icon: <ScienceIcon sx={{ fontSize: 32, color: '#00695C' }} />,
    title: 'openFDA Integration',
    desc: 'Live data from the FDA Adverse Event Reporting System with CSV fallback.',
  },
  {
    icon: <VerifiedIcon sx={{ fontSize: 32, color: '#1565C0' }} />,
    title: 'ICH CTD Compliance Check',
    desc: 'Automated dossier gap analysis against ICH CTD Modules 1–5 requirements.',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 32, color: '#00695C' }} />,
    title: 'AI-Powered Explanations',
    desc: 'IBM watsonx.ai (Granite) provides regulatory-grade plain-language insights.',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      {/* Hero */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
          color: 'white',
          borderRadius: 3,
          p: { xs: 3, md: 5 },
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Chip
            label="Regulatory AI Platform"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', mb: 2, fontWeight: 600 }}
          />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Drug Safety Signal Detector &amp;
            <br />
            Regulatory Submission Readiness
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 600, mb: 3 }}>
            A pharmacovigilance platform for detecting adverse drug reaction signals from FAERS data
            and assessing ICH CTD dossier completeness — powered by IBM watsonx.ai.
          </Typography>
          <Chip
            icon={<SecurityIcon sx={{ color: 'white !important', fontSize: 16 }} />}
            label="Safety signals are NOT proof of causality — always consult a clinical expert"
            sx={{ bgcolor: 'rgba(255,200,0,0.2)', color: 'white', fontWeight: 500, fontSize: 12 }}
          />
        </Box>
        {/* Decorative background */}
        <Box
          sx={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 300,
            height: 300,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
          }}
        />
      </Paper>

      {/* Mode Cards */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Choose a Mode
      </Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {/* Signal Detection Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'primary.main',
              height: '100%',
              transition: 'transform 0.15s, box-shadow 0.15s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
            }}
          >
            <CardActionArea onClick={() => navigate('/signals')} sx={{ height: '100%', p: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: 'primary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BiotechIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Signal Detection
                    </Typography>
                    <Chip label="Mode 1" size="small" color="primary" />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter a drug name to analyse FAERS adverse event reports. Computes PRR to rank
                  signals, visualises trends over time, and provides AI-generated plain-language explanations.
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['openFDA API', 'PRR Algorithm', 'Signal Ranking', 'Trend Charts'].map((t) => (
                    <Chip key={t} label={t} size="small" variant="outlined" color="primary" />
                  ))}
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Submission Readiness Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'secondary.main',
              height: '100%',
              transition: 'transform 0.15s, box-shadow 0.15s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
            }}
          >
            <CardActionArea onClick={() => navigate('/readiness')} sx={{ height: '100%', p: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: '#e0f2f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AssignmentTurnedInIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Submission Readiness
                    </Typography>
                    <Chip label="Mode 2" size="small" color="secondary" />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Upload a regulatory dossier (.txt or .pdf) to check completeness against ICH CTD
                  Modules 1–5 requirements and generate a prioritised gap report.
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['ICH CTD', 'Gap Analysis', 'Module Scores', 'PDF/TXT Support'].map((t) => (
                    <Chip key={t} label={t} size="small" variant="outlined" color="secondary" />
                  ))}
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* Features */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Platform Capabilities
      </Typography>
      <Grid container spacing={2}>
        {FEATURES.map((f) => (
          <Grid item xs={12} sm={6} md={3} key={f.title}>
            <Paper
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 2, height: '100%' }}
            >
              <Box sx={{ mb: 1.5 }}>{f.icon}</Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                {f.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {f.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Footer note */}
      <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          DrugSafety AI · Built with IBM watsonx.ai · Data source: openFDA FAERS · ICH CTD requirements are hardcoded, not AI-generated
        </Typography>
      </Box>
    </Box>
  )
}
