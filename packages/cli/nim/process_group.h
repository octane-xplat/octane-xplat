#ifndef XPLAT_PROCESS_GROUP_H
#define XPLAT_PROCESS_GROUP_H
/* Observe child exit without releasing its PID; count every other group member. */
int xplat_exit_observed(int pid);
int xplat_group_descendants(int leader);
#endif
