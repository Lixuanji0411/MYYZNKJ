import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

interface DataTablePaginationProps {
  totalItems: number
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  pageSizeOptions?: number[]
}

export function DataTablePagination({
  totalItems,
  pagination,
  onPaginationChange,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTablePaginationProps) {
  const { pageIndex, pageSize } = pagination
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const [jumpInput, setJumpInput] = useState('')

  const startItem = totalItems === 0 ? 0 : pageIndex * pageSize + 1
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems)

  function goToPage(page: number) {
    const safePage = Math.max(0, Math.min(page, totalPages - 1))
    onPaginationChange({ ...pagination, pageIndex: safePage })
  }

  function handleJump() {
    const page = parseInt(jumpInput, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      goToPage(page - 1)
      setJumpInput('')
    }
  }

  // 生成页码列表（最多显示7个页码）
  function getPageNumbers(): (number | 'ellipsis')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i)
    }
    const pages: (number | 'ellipsis')[] = [0]
    if (pageIndex > 3) pages.push('ellipsis')

    const start = Math.max(1, pageIndex - 1)
    const end = Math.min(totalPages - 2, pageIndex + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (pageIndex < totalPages - 4) pages.push('ellipsis')
    pages.push(totalPages - 1)
    return pages
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-4 mt-4">
      {/* 左侧：显示信息 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          共 <strong className="text-foreground">{totalItems}</strong> 条，
          显示 {startItem}-{endItem}
        </span>
        <div className="flex items-center gap-1.5">
          <span>每页</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPaginationChange({ pageIndex: 0, pageSize: Number(v) })}
          >
            <SelectTrigger className="h-7 w-[62px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>条</span>
        </div>
      </div>

      {/* 右侧：分页控制 */}
      <div className="flex items-center gap-1.5">
        {/* 首页 */}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={pageIndex === 0}
          onClick={() => goToPage(0)}
          title="首页"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        {/* 上一页 */}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={pageIndex === 0}
          onClick={() => goToPage(pageIndex - 1)}
          title="上一页"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {/* 页码按钮 */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, i) =>
            page === 'ellipsis' ? (
              <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span>
            ) : (
              <Button
                key={page}
                variant={page === pageIndex ? 'default' : 'outline'}
                size="icon"
                className="h-7 w-7 text-xs"
                onClick={() => goToPage(page)}
              >
                {page + 1}
              </Button>
            )
          )}
        </div>

        {/* 移动端显示当前页/总页 */}
        <span className="sm:hidden text-xs text-muted-foreground px-2">
          {pageIndex + 1} / {totalPages}
        </span>

        {/* 下一页 */}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={pageIndex >= totalPages - 1}
          onClick={() => goToPage(pageIndex + 1)}
          title="下一页"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        {/* 末页 */}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={pageIndex >= totalPages - 1}
          onClick={() => goToPage(totalPages - 1)}
          title="末页"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>

        {/* 跳转 */}
        <div className="hidden sm:flex items-center gap-1.5 ml-2 text-xs text-muted-foreground">
          <span>跳至</span>
          <Input
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            className="h-7 w-12 text-xs text-center"
            placeholder={String(pageIndex + 1)}
          />
          <span>页</span>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={handleJump}>
            GO
          </Button>
        </div>
      </div>
    </div>
  )
}

/** 对数据进行客户端分页 */
export function paginateData<T>(data: T[], pagination: PaginationState): T[] {
  const start = pagination.pageIndex * pagination.pageSize
  return data.slice(start, start + pagination.pageSize)
}
