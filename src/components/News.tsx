import '../App.css'
import { useEffect, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../store/store'
import { fetchNews, fetchMoreNews, refreshNews, clearError } from '../store/newsSlice'
import Footer from './Footer'
import { ClipLoader } from 'react-spinners'

// Интерфейс для группированных новостей
interface GroupedNews {
    date: string
    displayDate: string
    articles: any[]
}

const News = () => {
    const dispatch = useDispatch<AppDispatch>()
    const observerRef = useRef<HTMLDivElement>(null)
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false)

    useEffect(() => {
        const loadInitialData = async () => {
        if (articles.length === 0) {
            await dispatch(fetchNews())
            setIsInitialLoadComplete(true)
        }
        }
    
        loadInitialData()

        // Автообновление каждые 5 минут 
        const interval = setInterval(() => {
            dispatch(refreshNews())
        }, 5 * 60 * 1000)
    
        return () => clearInterval(interval)
    }, [dispatch])

    const { 
        articles, 
        loading, 
        loadingMore, 
        error, 
        hasMoreSections 
    } = useSelector((state: RootState) => state.news)


    // Обновите функцию groupNewsByDate
const groupNewsByDate = (articles: any[]): GroupedNews[] => {
    // Сначала сортируем все статьи по дате (новые сверху)
    const sortedArticles = [...articles].sort((a, b) => {
        return new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
    })

    const grouped: { [key: string]: any[] } = {}

    sortedArticles.forEach(article => {
        const date = new Date(article.published_date)
        const dateKey = date.toDateString()
        
        if (!grouped[dateKey]) {
            grouped[dateKey] = []
        }
        grouped[dateKey].push(article)
    })

    // Сортируем группы по дате (новые даты сверху)
    return Object.keys(grouped)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .map(dateKey => ({
            date: dateKey,
            displayDate: formatDateHeader(dateKey),
            articles: grouped[dateKey] // Уже отсортированы выше
        }))
}
    // Форматирование заголовка даты
    const formatDateHeader = (dateString: string): string => {
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const isToday = date.toDateString() === today.toDateString()
        const isYesterday = date.toDateString() === yesterday.toDateString()

        if (isToday) {
            return 'Today'
        } else if (isYesterday) {
            return 'Yesterday'
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }
    }

    // Форматирование времени для отдельной статьи
    const formatTime = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

  // Функция для подгрузки новостей
    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMoreSections) {
            dispatch(fetchMoreNews())
        }
    }, [dispatch, loadingMore, hasMoreSections])

    // Обновите Intersection Observer useEffect
useEffect(() => {
    // Не включаем пагинацию пока не завершена первоначальная загрузка
    if (!isInitialLoadComplete) {
        return
    }

    const observer = new IntersectionObserver(
        (entries) => {
            const target = entries[0]
            if (target.isIntersecting && hasMoreSections && !loadingMore) {
                handleLoadMore()
            }
        },
        {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
        }
    )

    if (observerRef.current) {
        observer.observe(observerRef.current)
    }

    return () => {
        if (observerRef.current) {
            observer.unobserve(observerRef.current)
        }
    }
}, [handleLoadMore, hasMoreSections, loadingMore, isInitialLoadComplete]) 

    // Повторная попытка при ошибке
    const handleRetry = () => {
        dispatch(clearError())
        dispatch(fetchNews())
    }

    // Группируем новости по датам
    const groupedNews = groupNewsByDate(articles)

    return (
        <div className='min-h-screen w-full p-4'>
            <div className='max-w-4xl mx-auto'>
                <div className='flex justify-between items-center mb-6'>
                    <h1 className='text-3xl font-bold'>Latest News</h1>
                    {/* {hasMoreSections && (
                        <button 
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className='bg-blue-500 cursor-pointer hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors'
                        >
                            {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                    )} */}
                </div>

                {/* Ошибка с кнопкой повтора */}
                {error && (
                    <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center'>
                        <span>Error: {error}</span>
                        <button 
                            onClick={handleRetry}
                            className='bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm'
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Загрузка первичных данных */}
                {loading && articles.length === 0 && (
                    <div className='text-center py-8'>
                        <ClipLoader color="#2732c9" loading={true} size={50} />
                        <p className='mt-4 text-gray-500'>Loading news...</p>
                    </div>
                )}

                {/* Группированные новости по датам */}
                {groupedNews.map((group, groupIndex) => (
                    <div key={group.date} className='mb-8'>
                        {/* Заголовок даты */}
                        <div className='sticky top-0 bg-[#f2f2f2] backdrop-blur-sm py-3 mb-4 border-b-2 border-blue-500'>
                            <h2 className='text-2xl font-semibold text-gray-800'>
                                {group.displayDate}
                            </h2>
                            <span className='text-sm text-gray-500'>
                                {group.articles.length} {group.articles.length === 1 ? 'article' : 'articles'}
                            </span>
                        </div>

                        {/* Список статей для этой даты */}
                        <div className='space-y-4'>
                            {group.articles.map((article, index) => (
                                <div 
                                    key={`${article.url}-${groupIndex}-${index}`} 
                                    className='flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-200'
                                >
                                    <div className='flex-shrink-0'>
                                        <img 
                                            className='w-[120px] h-[90px] object-cover rounded-lg' 
                                            src={article.multimedia?.[0]?.url || 'https://i.ibb.co/RGCDDcHs/0d998bb6b4366e3f47beeadb8b19e6d914e9e43f.png'} 
                                            alt={article.title}
                                            loading="lazy"
                                        />
                                    </div>
                                    
                                    <div className='flex-1'>
                                        <div className='flex justify-between items-start mb-2'>
                                            <div className='text-blue-500 font-semibold text-sm'>
                                                {article.section?.toUpperCase() || 'NEWS'}
                                            </div>
                                            <div className='text-gray-500 text-xs'>
                                                {formatTime(article.published_date)}
                                            </div>
                                        </div>
                                        
                                        <h2 className='font-bold text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors'>
                                            {article.title}
                                        </h2>
                                        
                                        <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                                            {article.abstract}
                                        </p>
                                        
                                        {article.url && (
                                            <a 
                                                href={article.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className='text-blue-500 text-sm hover:underline font-medium'
                                            >
                                                Read more →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Элемент-триггер для infinite scroll */}
                {hasMoreSections && (
                    <div ref={observerRef} className='h-20 flex items-center justify-center'>
                        {loadingMore && (
                            <div className='text-center'>
                                <ClipLoader color="#2732c9" loading={true} size={30} />
                                <p className='mt-2 text-gray-500'>Loading more news...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Сообщение когда больше нет новостей */}
                {!hasMoreSections && articles.length > 0 && (
                    <div className='text-center py-8 text-gray-500 border-t pt-8'>
                        <p className='text-lg font-medium'>🎉 You've reached the end!</p>
                        <p className='text-sm mt-2'>No more articles to load.</p>
                    </div>
                )}
            </div>
            <Footer/>
        </div>
    )
}

export default News