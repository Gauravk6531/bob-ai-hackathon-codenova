import { Box, Typography, Paper, Grid, Chip, Alert } from '@mui/material'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ConstructionIcon from '@mui/icons-material/Construction'

export default function Reports() {
  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Saved analyses and audit history
          </Typography>
        </Box>
        <Chip label="Coming Soon" color="default" sx={{ ml: 'auto' }} />
      </Box>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        The Reports module will allow you to save, compare, and export signal detection and submission readiness analyses.
      </Alert>

      <Grid container spacing={3}>
        {[
          {
            title: 'Saved Signal Analyses',
            desc: 'Store and compare FAERS signal detection runs across different drugs and date ranges.',
          },
          {
            title: 'Submission Audit Trail',
            desc: 'Track dossier versions and readiness score improvements over time.',
          },
          {
            title: 'Export to PDF / CSV',
            desc: 'Generate regulatory-ready reports in standard formats.',
          },
        ].map((item) => (
          <Grid item xs={12} md={4} key={item.title}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                opacity: 0.7,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ConstructionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  {item.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {item.desc}
              </Typography>
              <Chip label="Planned" size="small" sx={{ width: 'fit-content', mt: 'auto' }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
