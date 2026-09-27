export default function Skeleton({
  variant = 'rect',
  width,
  height,
  className = '',
  ...props
}) {
  const variantStyles = {
    text: 'h-4 w-full rounded-sm',
    rect: 'rounded-lg',
    circle: 'rounded-full aspect-square',
  }[variant] || 'rounded-lg'

  const style = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  }

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`
        animate-pulse bg-bg-muted/80
        ${variantStyles}
        ${className}
      `}
      {...props}
    />
  )
}
