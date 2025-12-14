package com.timetracker.repository;

import com.timetracker.entity.TimeEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    List<TimeEntry> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);
    
    List<TimeEntry> findByUserId(Long userId);
    
    Page<TimeEntry> findByUserId(Long userId, Pageable pageable);
    
    List<TimeEntry> findByProjectIdAndDateBetween(Long projectId, LocalDate from, LocalDate to);
    
    @Query("SELECT te FROM TimeEntry te WHERE te.userId = :userId AND YEAR(te.date) = :year AND MONTH(te.date) = :month")
    List<TimeEntry> findByUserIdAndYearAndMonth(@Param("userId") Long userId, 
                                                  @Param("year") int year, 
                                                  @Param("month") int month);
    
    @Query("SELECT te FROM TimeEntry te WHERE te.projectId = :projectId AND YEAR(te.date) = :year AND MONTH(te.date) = :month")
    List<TimeEntry> findByProjectIdAndYearAndMonth(@Param("projectId") Long projectId, 
                                                     @Param("year") int year, 
                                                     @Param("month") int month);
    
    List<TimeEntry> findByStatus(TimeEntry.Status status);
}
