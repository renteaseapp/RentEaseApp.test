
import { StaticPageContent, FaqCategory, FaqItem, ContactFormPayload, ApiError } from '../types';

const mockStaticPages: { [slug: string]: StaticPageContent } = {
    'about-us': {
        slug: 'about-us',
        title: 'About RentEase',
        content_html: '<p><strong>RentEase</strong> is your go-to platform for peer-to-peer rentals. We connect people who have items with those who need them, fostering a community of sharing and sustainability.</p><p>Our mission is to make renting easy, safe, and accessible for everyone.</p>',
        updated_at: new Date().toISOString(),
        is_published: true,
    },
    'terms-of-service': {
        slug: 'terms-of-service',
        title: 'Terms of Service',
        content_html: '<p>Welcome to RentEase! These terms and conditions outline the rules and regulations for the use of RentEase\'s Website.</p><p>By accessing this website we assume you accept these terms and conditions. Do not continue to use RentEase if you do not agree to take all of the terms and conditions stated on this page.</p><h3>License</h3><p>Unless otherwise stated, RentEase and/or its licensors own the intellectual property rights for all material on RentEase. All intellectual property rights are reserved.</p>',
        updated_at: new Date().toISOString(),
        is_published: true,
    },
    'privacy-policy': {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        content_html: '<p>Your privacy is important to us. It is RentEase\'s policy to respect your privacy regarding any information we may collect from you across our website.</p><p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</p>',
        updated_at: new Date().toISOString(),
        is_published: true,
    }
};

const mockFaqCategories: FaqCategory[] = [
    {
        id: 1, name: 'General', is_active: true, sort_order: 1,
        faqs: [
            { id: 1, faq_category_id: 1, question: 'What is RentEase?', answer: 'RentEase is a platform for renting items from other users.', is_active: true },
            { id: 2, faq_category_id: 1, question: 'How do I sign up?', answer: 'Click the "Sign Up" button and fill in your details.', is_active: true },
        ]
    },
    {
        id: 2, name: 'For Renters', is_active: true, sort_order: 2,
        faqs: [
            { id: 3, faq_category_id: 2, question: 'How do I rent an item?', answer: 'Find an item, select dates, and send a request to the owner.', is_active: true },
            { id: 4, faq_category_id: 2, question: 'What if an item is damaged?', answer: 'Contact the owner immediately and refer to our dispute resolution process.', is_active: true },
        ]
    },
     {
        id: 3, name: 'For Owners', is_active: true, sort_order: 3,
        faqs: [
            { id: 5, faq_category_id: 3, question: 'How do I list an item?', answer: 'Go to your dashboard and click "Add New Listing". Fill in the details and photos.', is_active: true },
        ]
    }
];


export const getStaticPage = async (slug: string): Promise<StaticPageContent> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const page = mockStaticPages[slug];
            if (page && page.is_published) {
                resolve(page);
            } else {
                reject({ message: 'Page not found', status: 404 } as ApiError);
            }
        }, 300);
    });
};

export const getFaqs = async (): Promise<FaqCategory[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockFaqCategories.filter(cat => cat.is_active).map(cat => ({
                ...cat,
                faqs: cat.faqs?.filter(faq => faq.is_active)
            })));
        }, 400);
    });
};

export const submitContactForm = async (payload: ContactFormPayload): Promise<{ message: string }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('Contact form submitted:', payload);
            resolve({ message: 'Your message has been sent successfully. We will get back to you soon!' });
        }, 600);
    });
};
