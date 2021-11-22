<div
  border="~ rounded-sm {isOn ? 'blue-300' : 'gray-300 dark:dark-blue-600'} {isGroupHover
    ? 'group-hover:blue-300'
    : 'hover:blue-300'}"
>
  Hello World
</div>

<style>
[border~="blue-300"] {
  --tw-border-opacity: 1;
  border-color: rgba(147, 197, 253, var(--tw-border-opacity));
}
[border~="gray-300"] {
  --tw-border-opacity: 1;
  border-color: rgba(209, 213, 219, var(--tw-border-opacity));
}
.group:hover [border~="group-hover:blue-300"] {
  --tw-border-opacity: 1;
  border-color: rgba(147, 197, 253, var(--tw-border-opacity));
}
[border~="hover:blue-300"]:hover {
  --tw-border-opacity: 1;
  border-color: rgba(147, 197, 253, var(--tw-border-opacity));
}
.dark [border~="dark:dark-blue-600"] {
  --tw-border-opacity: 1;
  border-*-color: rgba(37, 99, 235, var(--tw-border-opacity));
}
[border~="rounded-sm"] {
  border-radius: 0.125rem;
}
[border~="~"] {
  border-width: 1px;
}
</style>