
export interface AppProfile {
    id: 'tech' | 'real-estate';
    name: string;
    appName: string;
    appDescription: string;
    theme: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        bgColor: string;
        panelColor: string;
    };
    prompts: {
        newsSearch: string;
        editorialGen: string;
        imageGen: string;
    };
    icons: {
        dashboard: string; // just strings for now, will map to components in App
    };
}

export const PROFILES: Record<string, AppProfile> = {
    tech: {
        id: 'tech',
        name: 'Teknowguy',
        appName: 'Teknowguy',
        appDescription: 'Autonomous Publishing Protocol',
        theme: {
            primaryColor: 'red-600',
            secondaryColor: 'slate-950',
            accentColor: 'red-500',
            bgColor: 'slate-950', // approximating the dark theme
            panelColor: 'slate-900',
        },
        prompts: {
            newsSearch: "Identify the top 5 most critical technology news stories from the last 24 hours.",
            editorialGen: "Write an EDITORIAL GRADE technical article.",
            imageGen: "Professional tech blog editorial image. High-end, clean, futuristic photography style.",
        },
        icons: {
            dashboard: 'LayoutDashboard'
        }
    },
    'real-estate': {
        id: 'real-estate',
        name: 'MEGS Estate',
        appName: 'MEGS Estate',
        appDescription: 'Luxury Property Intelligence',
        theme: {
            primaryColor: 'blue-600',
            secondaryColor: 'slate-950',
            accentColor: 'yellow-500', // Gold-ish
            bgColor: 'slate-950',
            panelColor: 'slate-900',
        },
        prompts: {
            newsSearch: "Identify top 5 real estate market trends, mortgage rate updates, or luxury housing market news from the last 24 hours.",
            editorialGen: "Write a LUXURY REAL ESTATE market analysis or property showcase article.",
            imageGen: "Luxury real estate editorial image. Modern architecture, golden hour lighting, high-end interior.",
        },
        icons: {
            dashboard: 'Home'
        }
    }
};

export const DEFAULT_PROFILE = PROFILES.tech;
