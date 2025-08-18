import React from 'react';
import { Link } from '@inertiajs/react';
import clsx from 'clsx';

export default function Pagination({ links = [], from, to, total }) {
    if (links.length <= 3) return null;

    return (
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 gap-4">
            <p className="text-sm text-gray-700 dark:text-gray-400">
                Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of <span className="font-medium">{total}</span> results
            </p>
            
            <nav className="flex items-center gap-1 flex-wrap justify-center">
                {links.map((link, index) => {
                    const label = link.label.replace('&laquo;', '«').replace('&raquo;', '»');

                    return (
                        <Link
                            key={index}
                            href={link.url || '#'}
                            preserveScroll
                            className={clsx(
                                'px-3 py-2 text-sm rounded-md leading-4 transition-colors',
                                !link.url ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                                link.active ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white dark:bg-gray-800'
                            )}
                        >
                            {label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}