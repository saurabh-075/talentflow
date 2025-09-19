// React Router configuration
// Defines navigation between Jobs, Candidates, and Assessments
import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	ssr: true,
	prerender: ['/*?'],
} satisfies Config;
