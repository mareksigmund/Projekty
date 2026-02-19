using AutoLogix.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoLogix.Application.Services
{
    public static class ServiceEntryMapper
    {
        public static ServiceEntryResponse ToResponse(ServiceEntry e)
        {
            return new ServiceEntryResponse
            {
                Id = e.Id,
                VehicleId = e.VehicleId,

                ServiceDate = e.ServiceDate,
                MileageAtService = e.MileageAtService,

                Title = e.Title,
                Description = e.Description,

                Cost = e.Cost,
                WorkshopName = e.WorkshopName,
                WorkshopAddress = e.WorkshopAddress,

                NextServiceDate = e.NextServiceDate,
                NextServiceMileage = e.NextServiceMileage,

                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt,
                Notes = e.Notes
            };
        }
    }
}