import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

/* -------------------------------------------------------------------------- */
/*  Table                                                                     */
/* -------------------------------------------------------------------------- */

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children?: ReactNode
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto rounded-lg border border-primary/10">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  TableHeader                                                               */
/* -------------------------------------------------------------------------- */

export interface TableHeaderProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  children?: ReactNode
}

export function TableHeader({
  className,
  children,
  ...props
}: TableHeaderProps) {
  return (
    <thead
      className={cn('border-b border-primary/10 bg-primary/[0.02]', className)}
      {...props}
    >
      {children}
    </thead>
  )
}

/* -------------------------------------------------------------------------- */
/*  TableBody                                                                 */
/* -------------------------------------------------------------------------- */

export interface TableBodyProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  children?: ReactNode
}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  )
}

/* -------------------------------------------------------------------------- */
/*  TableRow                                                                  */
/* -------------------------------------------------------------------------- */

export interface TableRowProps
  extends HTMLAttributes<HTMLTableRowElement> {
  children?: ReactNode
}

export function TableRow({ className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-primary/10 transition-colors',
        'hover:bg-primary/[0.02]',
        'data-[state=selected]:bg-primary/5',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

/* -------------------------------------------------------------------------- */
/*  TableHead                                                                 */
/* -------------------------------------------------------------------------- */

export interface TableHeadProps
  extends HTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode
}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-primary/60',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

/* -------------------------------------------------------------------------- */
/*  TableCell                                                                 */
/* -------------------------------------------------------------------------- */

export interface TableCellProps
  extends HTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode
}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle text-primary [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}
