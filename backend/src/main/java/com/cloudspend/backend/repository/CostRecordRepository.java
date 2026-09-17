package com.cloudspend.backend.repository;

import com.cloudspend.backend.entity.CostRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

import java.util.List;

public interface CostRecordRepository extends JpaRepository<CostRecord, Long> {

    @Query("SELECT COALESCE(SUM(c.cost), 0) FROM CostRecord c")
    BigDecimal getTotalCost();

    @Query("""
        SELECT c.usageDate, SUM(c.cost)
        FROM CostRecord c
        GROUP BY c.usageDate
        ORDER BY c.usageDate
    """)
    List<Object[]> getDailyCost();

    @Query("""
        SELECT c.serviceName, SUM(c.cost)
        FROM CostRecord c
        GROUP BY c.serviceName
        ORDER BY SUM(c.cost) DESC
    """)
    List<Object[]> getCostByService();

    @Query("""
        SELECT c.region, SUM(c.cost)
        FROM CostRecord c
        GROUP BY c.region
        ORDER BY SUM(c.cost) DESC
    """)
    List<Object[]> getCostByRegion();

    @Query("""
        SELECT c.department, SUM(c.cost)
        FROM CostRecord c
        GROUP BY c.department
        ORDER BY SUM(c.cost) DESC
    """)
    List<Object[]> getCostByDepartment();

    @Query("""
        SELECT c.environment, SUM(c.cost)
        FROM CostRecord c
        GROUP BY c.environment
        ORDER BY SUM(c.cost) DESC
    """)
    List<Object[]> getCostByEnvironment();
    @Query("""
        SELECT c.resourceName, SUM(c.cost)
        FROM CostRecord c
        GROUP BY c.resourceName
        ORDER BY SUM(c.cost) DESC
    """)
    List<Object[]> getCostByResource();

    @Query("""
        SELECT c.resourceGroup, SUM(c.cost)
        FROM CostRecord c
        GROUP BY c.resourceGroup
        ORDER BY SUM(c.cost) DESC
    """)
    List<Object[]> getCostByResourceGroup();

}