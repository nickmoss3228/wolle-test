import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Article } from '../types/types'

const API_KEY = import.meta.env.VITE_NYT_API_KEY

const API_BASE = '/api/nyt'

// Доступные секции NYT API 
export const NEWS_SECTIONS = [
    'home', 'world', 'us', 'politics', 'business', 'technology', 
    'science', 'health', 'sports', 'arts', 'fashion', 'travel',
    'magazine', 'realestate'
]

interface NewsState {
    articles: Article[]
    loading: boolean
    loadingMore: boolean
    error: string | null
    currentSectionIndex: number
    hasMoreSections: boolean
    lastFetchTime: number
}

const initialState: NewsState = {
    articles: [],
    loading: false,
    loadingMore: false,
    error: null,
    currentSectionIndex: 0,
    hasMoreSections: true,
    lastFetchTime: 0
}

// Утилита для задержки (rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const fetchNews = createAsyncThunk(
    'news/fetchNews',
    async (_, { rejectWithValue }) => {
        try {
            // Article Search API
            const response = await fetch(
                `${API_BASE}/svc/search/v2/articlesearch.json?api-key=${API_KEY}&sort=newest&page=0`
            )
            
            if (!response.ok) {
                console.error('Response status:', response.status)
                if (response.status === 403) {
                    throw new Error('Access forbidden - API key may not have access to this endpoint')
                }
                if (response.status === 401) {
                    throw new Error('Invalid API key')
                }
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            
            // Article Search возвращает данные в response.docs
            const articles = (data.response?.docs || [])
                .slice(0, 20)
                .map((doc: any) => ({
                    title: doc.headline?.main || 'No title',
                    abstract: doc.abstract || doc.lead_paragraph || '',
                    url: doc.web_url,
                    published_date: doc.pub_date,
                    multimedia: doc.multimedia?.[0] ? [{
                        url: doc.multimedia[0].url?.startsWith('http') 
                            ? doc.multimedia[0].url 
                            : `https://static01.nyt.com/${doc.multimedia[0].url}`,
                        format: doc.multimedia[0].format || 'Large',
                        height: doc.multimedia[0].height || 0,
                        width: doc.multimedia[0].width || 0,
                        type: doc.multimedia[0].type || 'image',
                        subtype: doc.multimedia[0].subtype || '',
                        caption: doc.multimedia[0].caption || '',
                        copyright: doc.multimedia[0].copyright || ''
                    }] : []
                }))
            
            return articles
        } catch (error: any) {
            console.error('Fetch error:', error)
            return rejectWithValue(error.message || 'Failed to fetch news')
        }
    }
)

// Загрузка дополнительных новостей
export const fetchMoreNews = createAsyncThunk(
    'news/fetchMoreNews',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { news: NewsState }
            const { currentSectionIndex } = state.news
            const nextSectionIndex = currentSectionIndex + 1
            
            if (nextSectionIndex >= NEWS_SECTIONS.length) {
                throw new Error('No more sections available')
            }
            
            await delay(1000) // Задержка для rate limiting
            
            const section = NEWS_SECTIONS[nextSectionIndex]
            const response = await fetch(
                `${API_BASE}/svc/topstories/v2/${section}.json?api-key=${API_KEY}`
            )
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait before making another request.')
                }
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            
            return { 
                articles: data.results || [], 
                sectionIndex: nextSectionIndex 
            }
        } catch (error: any) {
            console.error('Fetch more error:', error)
            return rejectWithValue(error.message || 'Failed to fetch more news')
        }
    }
)

// Обновление новостей (для автоматического обновления)
export const refreshNews = createAsyncThunk(
    'news/refreshNews',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { news: NewsState }
            const now = Date.now()
            
            // Ограничиваем частоту запросов
            if (now - state.news.lastFetchTime < 30000) { // 30 секунд минимум между запросами
                return state.news.articles
            }
            
            await delay(1000) // Задержка для rate limiting
            
            const response = await fetch(
                `${API_BASE}/svc/topstories/v2/home.json?api-key=${API_KEY}`
            )
            
            if (!response.ok) {
                if (response.status === 429) {
                    console.warn('Rate limit hit during refresh')
                    return state.news.articles // Возвращаем существующие статьи
                }
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            
            // Сортируем и фильтруем новые статьи
            const freshArticles = (data.results || [])
                .slice(0, 20)
                .sort((a: Article, b: Article) => {
                    const dateA = new Date(a.published_date)
                    const dateB = new Date(b.published_date)
                    return dateB.getTime() - dateA.getTime()
                })
            
            return freshArticles
        } catch (error: any) {
            console.error('Refresh error:', error)
            return rejectWithValue(error.message || 'Failed to refresh news')
        }
    }
)

const newsSlice = createSlice({
    name: 'news',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            // Первичная загрузка
            .addCase(fetchNews.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchNews.fulfilled, (state, action) => {
                state.loading = false
                state.articles = action.payload
                state.currentSectionIndex = 0
                state.hasMoreSections = true
                state.lastFetchTime = Date.now()
            })
            .addCase(fetchNews.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
            
            // Загрузка дополнительных новостей
            .addCase(fetchMoreNews.pending, (state) => {
                state.loadingMore = true
                state.error = null
            })
            .addCase(fetchMoreNews.fulfilled, (state, action) => {
                state.loadingMore = false
                
                // Фильтруем дубликаты перед добавлением
                const newArticles = action.payload.articles.filter((newArticle: Article) =>
                    !state.articles.some(existing => existing.url === newArticle.url)
                )
                
                state.articles = [...state.articles, ...newArticles]
                state.currentSectionIndex = action.payload.sectionIndex
                state.hasMoreSections = action.payload.sectionIndex < NEWS_SECTIONS.length - 1
            })
            .addCase(fetchMoreNews.rejected, (state, action) => {
                state.loadingMore = false
                state.error = action.payload as string
            })
            
            // Обновление новостей
            .addCase(refreshNews.pending, (state) => {
                // Не показываем loading при обновлении
            })
            .addCase(refreshNews.fulfilled, (state, action) => {
                // Обновляем только если есть новые статьи
                if (Array.isArray(action.payload)) {
                    state.articles = action.payload
                    state.lastFetchTime = Date.now()
                }
            })
            .addCase(refreshNews.rejected, (state, action) => {
                // Игнорируем ошибки при обновлении
                console.warn('Failed to refresh:', action.payload)
            })
    }
})

export const { clearError } = newsSlice.actions
export default newsSlice.reducer